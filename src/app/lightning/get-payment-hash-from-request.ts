import { decodeInvoice } from "@domain/bitcoin/lightning"

export const getPaymentHashFromRequest = (paymentRequest: EncodedPaymentRequest): PaymentHash | Error => {
  const decodedInvoice = decodeInvoice(paymentRequest)

  if (decodedInvoice instanceof Error) return decodedInvoice

  const { paymentHash } = decodedInvoice

  return paymentHash
}
