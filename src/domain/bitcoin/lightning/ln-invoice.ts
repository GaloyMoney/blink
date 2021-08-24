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

  const paymentSecret: PaymentSecret | null = decodedInvoice.payment
    ? decodedInvoice.payment
    : null
  const amount: Satoshis | null = decodedInvoice.tokens
    ? toSats(decodedInvoice.tokens)
    : null
  const cltvDelta: number | null = decodedInvoice.cltv_delta
    ? decodedInvoice.cltv_delta
    : null

  let routeHints: RouteHint[] = []
  if (decodedInvoice.routes) {
    decodedInvoice.routes.forEach((route) =>
      routeHints.push({
        baseFeeMTokens: route.base_fee_mtokens,
        channel: route.channel,
        cltvDelta: route.cltv_delta,
        feeRate: route.feeRate,
        nodePubkey: route.public_key as Pubkey,
      }),
    )
  }

  return {
    amount,
    paymentSecret,
    routeHints,
    cltvDelta,
    paymentRequest: bolt11EncodedInvoice as EncodedPaymentRequest,
    paymentHash: decodedInvoice.id as PaymentHash,
    destination: decodedInvoice.destination as Pubkey,
  }
}
