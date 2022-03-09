import { paymentAmountFromSats } from "@domain/shared"
import { toMilliSatsFromNumber, toSats } from "@domain/bitcoin"
import { parsePaymentRequest } from "invoices"

import { LnInvoiceDecodeError } from "./errors"

import { LnInvoiceMissingPaymentSecretError, UnknownLnInvoiceDecodeError } from "."

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
  const paymentSecret: PaymentIdentifyingSecret = decodedInvoice.payment
  const amount: Satoshis | null = decodedInvoice.tokens
    ? toSats(decodedInvoice.tokens)
    : null
  const paymentAmount: BtcPaymentAmount | null = amount
    ? paymentAmountFromSats(amount)
    : null
  const cltvDelta: number | null = decodedInvoice.cltv_delta
    ? decodedInvoice.cltv_delta
    : null
  const expiresAt = new Date(decodedInvoice.expires_at)
  const isExpired = !!decodedInvoice.is_expired

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
    paymentAmount,
    paymentSecret,
    expiresAt,
    isExpired,
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
