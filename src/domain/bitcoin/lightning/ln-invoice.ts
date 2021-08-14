import lightningPayReq from "bolt11"
import { LnInvoiceDecodeError } from "./errors"

const safeDecode = (
  bolt11EncodedInvoice: string,
): lightningPayReq.PaymentRequestObject | LnInvoiceDecodeError => {
  try {
    return lightningPayReq.decode(bolt11EncodedInvoice)
  } catch (err) {
    return new LnInvoiceDecodeError(err)
  }
}

export const decodeInvoice = (
  bolt11EncodedInvoice: string,
): LnInvoice | LnInvoiceDecodeError => {
  const decodedInvoice = safeDecode(bolt11EncodedInvoice)

  if (decodedInvoice instanceof Error) return decodedInvoice

  let paymentHash: PaymentHash | null = null,
    paymentSecret: PaymentSecret | null = null

  decodedInvoice.tags.forEach((tag) => {
    const tagError = typeof tag.data != "string"
    switch (tag.tagName) {
      case "payment_hash":
        if (tagError) {
          return new LnInvoiceDecodeError("Irregular payment_hash")
        }
        paymentHash = tag.data as PaymentHash
        break

      case "payment_secret":
        if (tagError) {
          return new LnInvoiceDecodeError("Irregular payment_secret")
        }
        paymentSecret = tag.data as PaymentSecret
        break
    }
  })

  if (!paymentHash || !paymentSecret) {
    return new LnInvoiceDecodeError("Invalid invoice data")
  }

  return {
    paymentRequest: bolt11EncodedInvoice as EncodedPaymentRequest,
    paymentHash,
    paymentSecret,
  }
}
