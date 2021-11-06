import { LndService } from "@services/lnd"

export const lookupInvoiceByHashAndPubkey = async ({
  paymentHash,
  pubkey,
}: {
  paymentHash: PaymentHash
  pubkey: Pubkey
}): Promise<LnInvoiceLookup | ApplicationError> => {
  const lndService = LndService()
  if (lndService instanceof Error) return lndService
  return lndService.lookupInvoice({ paymentHash, pubkey })
}
