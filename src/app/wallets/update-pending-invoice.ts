import { redlock } from "@core/lock"
import { toSats } from "@domain/bitcoin"
import { InvoiceNotFoundError } from "@domain/bitcoin/lightning"
import { toLiabilitiesAccountId } from "@domain/ledger"
import { LndService } from "@services/lnd"
import { WalletInvoicesRepository } from "@services/mongoose"
import { PriceService } from "@services/price"

const updatePendingInvoices = async ({
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
  const lnLookupInvoice = await lndService.lookupInvoice({ pubkey, paymentHash })
  if (lnLookupInvoice instanceof InvoiceNotFoundError) {
    const isDeleted = walletInvoicesRepo.deleteByPaymentHash(paymentHash)
    if (isDeleted instanceof Error) {
      logger.error({ walletInvoice }, "impossible to delete WalletInvoice entry")
      return isDeleted
    }
  }
  if (lnLookupInvoice instanceof Error) return lnLookupInvoice

  const { isSettled } = lnLookupInvoice
  if (isSettled) {
    const liabilitiesAccountId = toLiabilitiesAccountId(walletId)

    return redlock({ path: paymentHash, logger, lock }, async () => {
      if (walletInvoice.paid) {
        logger.info("invoice has already been processed")
        return
      }

      walletInvoice.paid = true
      const updatedWalletInvoice = await walletInvoicesRepo.update(walletInvoice)
      if (updatedWalletInvoice instanceof Error) return updatedWalletInvoice

      const price = await PriceService().getCurrentPrice()
      if (price instanceof Error) return price

      const fee = 0
      const { description, sats } = lnLookupInvoice

      // Where do we implement 'currencies' property... Account?
    })
  }
}
