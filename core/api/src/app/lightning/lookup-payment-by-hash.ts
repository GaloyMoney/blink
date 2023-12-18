import { LndService } from "@/services/lnd"

export const lookupPaymentByHash = async (
  paymentHash: PaymentHash,
): Promise<LnPaymentLookup | LnFailedPartialPaymentLookup | ApplicationError> => {
  const lndService = LndService()
  if (lndService instanceof Error) return lndService
  return lndService.lookupPayment({ paymentHash })
}
