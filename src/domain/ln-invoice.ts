import { ok, err, Result } from "neverthrow"
import lightningPayReq from "bolt11"
import { toTypedError } from "./utils"

const toLnInvoiceDecodeError = toTypedError<LnInvoiceDecodeErrorType>({
  unknownMessage: "Unknown decoding error",
  _type: "LnInoviceDecodeError",
})

const safeDecode = Result.fromThrowable(lightningPayReq.decode, toLnInvoiceDecodeError)

export const decodeInvoice = (
  bolt11EncodedInvoice: string,
): Result<LnInvoice, LnInvoiceDecodeError> => {
  let paymentHash: PaymentHash | null = null
  let paymentSecret: PaymentSecret | null = null
  const paymentRequest: EncodedPaymentRequest = {
    inner: bolt11EncodedInvoice,
  }

  return safeDecode(bolt11EncodedInvoice).andThen(({ tags }) => {
    tags.forEach((tag) => {
      if (tag.tagName === "payment_hash") {
        if (typeof tag.data == "string") {
          paymentHash = { inner: tag.data }
        } else {
          return err(toLnInvoiceDecodeError({ message: "Irregular payment_hash" }))
        }
      }
      if (tag.tagName === "payment_secret") {
        if (typeof tag.data == "string") {
          paymentSecret = { inner: tag.data }
        } else {
          return err(toLnInvoiceDecodeError({ message: "Irregular payment_secret" }))
        }
      }
    })
    if (paymentHash == null || paymentSecret == null) {
      return err(toLnInvoiceDecodeError({ message: "Missing field" }))
    }
    return ok({ paymentHash, paymentSecret, paymentRequest })
  })
}
