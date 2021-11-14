import { getCurrentPrice } from "@app/prices"
import { getBalanceForWallet } from "@app/wallets"

import { InvoiceNotFoundError } from "@domain/bitcoin/lightning"
import { toLiabilitiesAccountId } from "@domain/ledger"
import { CouldNotFindError } from "@domain/errors"
import { DepositFeeCalculator } from "@domain/wallets"

import { LndService } from "@services/lnd"
import { LedgerService } from "@services/ledger"
import { WalletInvoicesRepository } from "@services/mongoose"
import { LockService } from "@services/lock"
import { NotificationsService } from "@services/notifications"

export const updatePendingInvoices = async ({
  walletId,
  logger,
  lock,
}: {
  walletId: WalletId
  logger: Logger
  lock?: DistributedLock
}) => {
  const invoicesRepo = WalletInvoicesRepository()

  const invoices = invoicesRepo.findPendingByWalletId(walletId)
  if (invoices instanceof Error) return invoices

  for await (const walletInvoice of invoices) {
    await updatePendingInvoice({ walletInvoice, logger, lock })
  }
}

export const updatePendingInvoiceByPaymentHash = async ({
  paymentHash,
  logger,
  lock,
}: {
  paymentHash: PaymentHash
  logger: Logger
  lock?: DistributedLock
}): Promise<boolean | ApplicationError> => {
  const invoicesRepo = WalletInvoicesRepository()
  const walletInvoice = await invoicesRepo.findByPaymentHash(paymentHash)
  if (walletInvoice instanceof CouldNotFindError) {
    logger.info({ paymentHash }, "WalletInvoice doesn't exist")
    return false
  }
  if (walletInvoice instanceof Error) return walletInvoice
  return updatePendingInvoice({ walletInvoice, logger, lock })
}

const updatePendingInvoice = async ({
  walletInvoice,
  logger,
  lock,
}: {
  walletInvoice: WalletInvoice
  logger: Logger
  lock?: DistributedLock
}): Promise<boolean | ApplicationError> => {
  const lndService = LndService()
  if (lndService instanceof Error) return lndService

  const walletInvoicesRepo = WalletInvoicesRepository()

  const { pubkey, paymentHash, walletId } = walletInvoice
  const lnInvoiceLookup = await lndService.lookupInvoice({ pubkey, paymentHash })
  if (lnInvoiceLookup instanceof InvoiceNotFoundError) {
    const isDeleted = walletInvoicesRepo.deleteByPaymentHash(paymentHash)
    if (isDeleted instanceof Error) {
      logger.error(
        { walletInvoice, error: isDeleted },
        "impossible to delete WalletInvoice entry",
      )
      return isDeleted
    }
    return false
  }
  if (lnInvoiceLookup instanceof Error) return lnInvoiceLookup

  if (lnInvoiceLookup.isSettled) {
    const pendingInvoiceLogger = logger.child({
      hash: paymentHash,
      wallet: walletId,
      topic: "payment",
      protocol: "lightning",
      transactionType: "receipt",
      onUs: false,
    })

    if (walletInvoice.paid) {
      pendingInvoiceLogger.info("invoice has already been processed")
      return true
    }

    const lockService = LockService()
    return lockService.lockPaymentHash({ paymentHash, logger, lock }, async () => {
      const invoiceToUpdate = await walletInvoicesRepo.findByPaymentHash(
        walletInvoice.paymentHash,
      )
      if (invoiceToUpdate instanceof CouldNotFindError) {
        pendingInvoiceLogger.error(
          { paymentHash: walletInvoice.paymentHash },
          "WalletInvoice doesn't exist",
        )
        return false
      }
      if (invoiceToUpdate instanceof Error) return invoiceToUpdate
      if (invoiceToUpdate.paid) {
        pendingInvoiceLogger.info("invoice has already been processed")
        return true
      }

      invoiceToUpdate.paid = true

      const updatedWalletInvoice = await walletInvoicesRepo.update(invoiceToUpdate)
      if (updatedWalletInvoice instanceof Error) return updatedWalletInvoice

      const usdPerSat = await getCurrentPrice()
      if (usdPerSat instanceof Error) return usdPerSat

      const { description, received } = lnInvoiceLookup
      const fee = DepositFeeCalculator().lnDepositFee()

      const usd = received * usdPerSat
      const usdFee = fee * usdPerSat

      const liabilitiesAccountId = toLiabilitiesAccountId(walletId)
      const ledgerService = LedgerService()
      const result = await ledgerService.addLnTxReceive({
        liabilitiesAccountId,
        paymentHash,
        description,
        sats: received,
        fee,
        usd,
        usdFee,
      })
      if (result instanceof Error) return result

      const recipientWalletBalance = await getBalanceForWallet({
        walletId: updatedWalletInvoice.walletId,
        logger,
      })

      if (recipientWalletBalance instanceof Error) return recipientWalletBalance

      const notificationsService = NotificationsService(logger)
      notificationsService.lnInvoicePaid({
        paymentHash,
        recipientWalletId: updatedWalletInvoice.walletId,
        recipientWalletBalance,
        payerWalletId: walletInvoice.walletId,
        amount: received,
        usdPerSat,
      })

      return true
    })
  }
  logger.debug({ invoice: lnInvoiceLookup }, "invoice has not been paid")
  return false
}
