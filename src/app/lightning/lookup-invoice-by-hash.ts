import { LndService } from "@services/lnd"
import { WalletInvoicesRepository } from "@services/mongoose"
import { RepositoryError } from "@domain/errors"

export const lookupInvoiceByHash = async (
  paymentHash: PaymentHash,
): Promise<LnInvoiceLookup | ApplicationError> => {
  const lndService = LndService()
  if (lndService instanceof Error) return lndService

  const invoicesRepo = WalletInvoicesRepository()
  const walletInvoice = await invoicesRepo.findByPaymentHash(paymentHash)

  if (walletInvoice instanceof RepositoryError) return walletInvoice

  const { pubkey } = walletInvoice

  return lndService.lookupInvoice({ paymentHash, pubkey })
}
