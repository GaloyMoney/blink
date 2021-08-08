import { ok, err, Result } from "neverthrow"
import lightningPayReq from "bolt11"
import { toTypedError } from "./utils"

const toLnInvoiceDecodeError = toTypedError<LnInvoiceDecodeErrorType>({
  unknownMessage: "Unknown decoding error",
  _type: "LnInvoiceDecodeError",
})

const safeDecode = Result.fromThrowable(lightningPayReq.decode, toLnInvoiceDecodeError)

export const decodeInvoice = (
  bolt11EncodedInvoice: string,
): Result<LnInvoice, LnInvoiceDecodeError> => {
  let paymentHash: PaymentHash | null = null
  let paymentSecret: PaymentSecret | null = null
  const paymentRequest = bolt11EncodedInvoice as EncodedPaymentRequest

  return safeDecode(bolt11EncodedInvoice).andThen(({ tags }) => {
    tags.forEach((tag) => {
      const tagError = typeof tag.data != "string"
      switch (tag.tagName) {
        case "payment_hash":
          if (tagError) {
            return err(toLnInvoiceDecodeError({ message: "Irregular payment_hash" }))
          }
          paymentHash = tag.data as PaymentHash
          break

        case "payment_secret":
          if (tagError) {
            return err(toLnInvoiceDecodeError({ message: "Irregular payment_secret" }))
          }
          paymentSecret = tag.data as PaymentSecret
          break
      }
    })
    if (paymentHash == null || paymentSecret == null) {
      return err(toLnInvoiceDecodeError({ message: "Missing field" }))
    }
    return ok({ paymentHash, paymentSecret, paymentRequest })
  })
}
