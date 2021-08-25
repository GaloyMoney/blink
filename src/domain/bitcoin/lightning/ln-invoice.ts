import { toSats } from "@domain/bitcoin"
import { parsePaymentRequest } from "invoices"
import { LnInvoiceDecodeError } from "./errors"

const safeDecode = (bolt11EncodedInvoice: string) => {
  try {
    return parsePaymentRequest({ request: bolt11EncodedInvoice })
  } catch (err) {
    return new LnInvoiceDecodeError(err)
  }
}

export const decodeInvoice = (
  bolt11EncodedInvoice: string,
): LnInvoice | LnInvoiceDecodeError => {
  const decodedInvoice = safeDecode(bolt11EncodedInvoice)
  if (decodedInvoice instanceof Error) return decodedInvoice

  const paymentSecret: PaymentSecret | undefined = decodedInvoice.payment
    ? decodedInvoice.payment
    : undefined
  const amount: Satoshis | null = decodedInvoice.tokens
    ? toSats(decodedInvoice.tokens)
    : null
  const cltvDelta: number | undefined = decodedInvoice.cltv_delta
    ? decodedInvoice.cltv_delta
    : undefined

  return {
    amount,
    paymentSecret,
    routeHints: decodedInvoice.routes,
    cltvDelta,
    paymentRequest: bolt11EncodedInvoice as EncodedPaymentRequest,
    paymentHash: decodedInvoice.id as PaymentHash,
    destination: decodedInvoice.destination as Pubkey,
    features: decodedInvoice.features,
  }
}
