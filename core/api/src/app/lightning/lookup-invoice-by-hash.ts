import { LndService } from "@/services/lnd"

export const lookupInvoiceByHash = async (
  paymentHash: PaymentHash,
): Promise<LnInvoiceLookup | ApplicationError> => {
  const lndService = LndService()
  if (lndService instanceof Error) return lndService
  return lndService.lookupInvoice({ paymentHash })
}
