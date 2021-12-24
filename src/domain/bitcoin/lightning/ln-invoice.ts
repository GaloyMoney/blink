import { toMilliSatsFromNumber, toSats } from "@domain/bitcoin"
import { parsePaymentRequest } from "invoices"
import { LnInvoiceMissingPaymentSecretError, UnknownLnInvoiceDecodeError } from "."
import { LnInvoiceDecodeError } from "./errors"

const safeDecode = (bolt11EncodedInvoice: EncodedPaymentRequest) => {
  try {
    return parsePaymentRequest({ request: bolt11EncodedInvoice })
  } catch (err) {
    return new UnknownLnInvoiceDecodeError(err)
  }
}

export const decodeInvoice = (
  bolt11EncodedInvoice: EncodedPaymentRequest,
): LnInvoice | LnInvoiceDecodeError => {
  const decodedInvoice = safeDecode(bolt11EncodedInvoice)
  if (decodedInvoice instanceof Error) return decodedInvoice

  if (!decodedInvoice.payment) {
    return new LnInvoiceMissingPaymentSecretError()
  }
  const paymentSecret: PaymentSecret = decodedInvoice.payment
  const amount: Satoshis | null = decodedInvoice.tokens
    ? toSats(decodedInvoice.tokens)
    : null
  const cltvDelta: number | null = decodedInvoice.cltv_delta
    ? decodedInvoice.cltv_delta
    : null

  let routeHints: Hop[][] = []
  if (decodedInvoice.routes) {
    routeHints = decodedInvoice.routes.map((rawRoute) =>
      rawRoute.map((route) => ({
        baseFeeMTokens: route.base_fee_mtokens,
        channel: route.channel,
        cltvDelta: route.cltv_delta,
        feeRate: route.fee_rate,
        nodePubkey: route.public_key as Pubkey,
      })),
    )
  }

  return {
    amount,
    paymentSecret,
    routeHints,
    cltvDelta,
    paymentRequest: bolt11EncodedInvoice as EncodedPaymentRequest,
    description: decodedInvoice.description || "",
    paymentHash: decodedInvoice.id as PaymentHash,
    destination: decodedInvoice.destination as Pubkey,
    milliSatsAmount: toMilliSatsFromNumber(decodedInvoice.mtokens || 0),
    features: (decodedInvoice.features || []) as LnInvoiceFeature[],
  }
}
