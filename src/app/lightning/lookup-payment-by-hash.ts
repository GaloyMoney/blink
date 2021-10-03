import { LndService } from "@services/lnd"
import { offchainLnds } from "@services/lnd/utils"
import { PaymentNotFoundError } from "@domain/bitcoin/lightning"

export const lookupPaymentByHash = async (
  paymentHash: PaymentHash,
): Promise<LnPaymentLookup | ApplicationError> => {
  const lndService = LndService()
  if (lndService instanceof Error) return lndService

  for (const { pubkey } of offchainLnds) {
    const payment = await lndService.lookupPayment({
      pubkey: pubkey as Pubkey,
      paymentHash,
    })
    if (payment instanceof Error) continue
    return payment
  }

  return new PaymentNotFoundError("Payment hash not found")
}
