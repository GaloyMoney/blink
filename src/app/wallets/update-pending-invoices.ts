import { redlock } from "@core/lock"
import { InvoiceNotFoundError } from "@domain/bitcoin/lightning"
import { toLiabilitiesAccountId, DepositFeeCalculator } from "@domain/ledger"
import { LndService } from "@services/lnd"
import { LedgerService } from "@services/ledger"
import { WalletInvoicesRepository } from "@services/mongoose"
import { PriceService } from "@services/price"

export const updatePendingInvoices = async ({
  walletId,
  logger,
  lock,
}: {
  walletId: WalletId
  logger: Logger
  lock
}) => {
  const invoicesRepo = WalletInvoicesRepository()

  const invoices = invoicesRepo.findPendingByWalletId(walletId)
  if (invoices instanceof Error) return invoices

  for await (const walletInvoice of invoices) {
    await updatePendingInvoice({ walletInvoice, logger, lock })
  }
}

const updatePendingInvoice = async ({
  walletInvoice,
  logger,
  lock,
}: {
  walletInvoice: WalletInvoice
  logger: Logger
  lock
}): Promise<void | ApplicationError> => {
  const lndService = LndService()
  if (lndService instanceof Error) return Error

  const walletInvoicesRepo = WalletInvoicesRepository()

  const { pubkey, paymentHash, walletId } = walletInvoice
  const lnInvoiceLookup = await lndService.lookupInvoice({ pubkey, paymentHash })
  if (lnInvoiceLookup instanceof InvoiceNotFoundError) {
    const isDeleted = walletInvoicesRepo.deleteByPaymentHash(paymentHash)
    if (isDeleted instanceof Error) {
      logger.error({ walletInvoice }, "impossible to delete WalletInvoice entry")
      return isDeleted
    }
    return
  }
  if (lnInvoiceLookup instanceof Error) return lnInvoiceLookup

  if (lnInvoiceLookup.isSettled) {
    if (walletInvoice.paid) {
      logger.info("invoice has already been processed")
      return
    }
    return redlock({ path: paymentHash, logger, lock }, async () => {
      const invoiceToUpdate = await walletInvoicesRepo.findByPaymentHash(
        walletInvoice.paymentHash,
      )
      if (invoiceToUpdate instanceof Error) return invoiceToUpdate
      invoiceToUpdate.paid = true

      const updatedWalletInvoice = await walletInvoicesRepo.update(invoiceToUpdate)
      if (updatedWalletInvoice instanceof Error) return updatedWalletInvoice

      const price = await PriceService().getCurrentPrice()
      if (price instanceof Error) return price

      const { description, received } = lnInvoiceLookup
      const fee = DepositFeeCalculator(received).lnDepositFee()

      const usd = received * price
      const usdFee = fee * price

      const liabilitiesAccountId = toLiabilitiesAccountId(walletId)
      const ledgerService = LedgerService()
      const result = await ledgerService.receiveLnTx({
        liabilitiesAccountId,
        paymentHash,
        description,
        sats: received,
        fee,
        usd,
        usdFee,
      })
      if (result instanceof Error) return result
    })
  }
}
