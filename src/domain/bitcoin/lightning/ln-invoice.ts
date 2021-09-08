import { toMilliSats, toSats } from "@domain/bitcoin"
import { parsePaymentRequest } from "invoices"
import { LnInvoiceDecodeError } from "./errors"

const safeDecode = (bolt11EncodedInvoice: EncodedPaymentRequest) => {
  try {
    return parsePaymentRequest({ request: bolt11EncodedInvoice })
  } catch (err) {
    return new LnInvoiceDecodeError(err)
  }
}

export const decodeInvoice = (
  bolt11EncodedInvoice: EncodedPaymentRequest,
): LnInvoice | LnInvoiceDecodeError => {
  const decodedInvoice = safeDecode(bolt11EncodedInvoice)
  if (decodedInvoice instanceof Error) return decodedInvoice

  if (!decodedInvoice.payment) {
    return new LnInvoiceDecodeError("Invoice missing paymentSecret")
  }
  const paymentSecret: PaymentSecret = decodedInvoice.payment
  const amount: Satoshis | null = decodedInvoice.tokens
    ? toSats(decodedInvoice.tokens)
    : null
  const cltvDelta: number | null = decodedInvoice.cltv_delta
    ? decodedInvoice.cltv_delta
    : null

  const routeHints: Hop[][] = []
  if (decodedInvoice.routes) {
    decodedInvoice.routes.forEach((rawRoute) => {
      const route: Hop[] = []
      route.push({
        baseFeeMTokens: rawRoute.base_fee_mtokens,
        channel: rawRoute.channel,
        cltvDelta: rawRoute.cltv_delta,
        feeRate: rawRoute.fee_rate,
        nodePubkey: rawRoute.public_key as Pubkey,
      })
      routeHints.push(route)
    })
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
    milliSatsAmount: decodedInvoice.mtokens
      ? toMilliSats(decodedInvoice.mtokens)
      : toMilliSats(0),
    features: (decodedInvoice.features || []) as LnInvoiceFeature[],
  }
}
