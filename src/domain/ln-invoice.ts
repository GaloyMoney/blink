import lightningPayReq from "bolt11"
import { LnInvoiceDecodeError } from "./errors"

const safeDecode = (
  bolt11EncodedInvoice,
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
    if (tag.tagName === "payment_hash") {
      if (typeof tag.data === "string") {
        paymentHash = tag.data as PaymentHash
      } else {
        return new LnInvoiceDecodeError("Irregular payment_hash")
      }
    }
    if (tag.tagName === "payment_secret") {
      if (typeof tag.data === "string") {
        paymentSecret = tag.data as PaymentSecret
      } else {
        return new LnInvoiceDecodeError("Irregular payment_secret")
      }
    }
  })

  if (!paymentHash || !paymentSecret) {
    return new LnInvoiceDecodeError("Invalid invoice data")
  }

  return { paymentHash, paymentSecret }
}
