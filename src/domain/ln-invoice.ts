import {
  ok,
  err,
  Result,
} from 'neverthrow'
import lightningPayReq from "bolt11"

const unknownLnInvoiceDecodeError: LnInvoiceDecodeError = {
  message: "Unknown decoding error"
};

const toLnInvoiceDecodeError = (error): LnInvoiceDecodeError => {
  if (typeof error.message == "string") {
    return { message: error.message }
  } else {
    return unknownLnInvoiceDecodeError
  }
}

const safeDecode = Result.fromThrowable(lightningPayReq.decode, toLnInvoiceDecodeError)

export const decodeInvoice = (bolt11EncodedInvoice: string): Result<LnInvoice, LnInvoiceDecodeError> => {
  let paymentHash, paymentSecret
  return safeDecode(bolt11EncodedInvoice).andThen(({tags}) => {

    tags.forEach((tag) => {
      if (tag.tagName === "payment_hash") {
        if (typeof tag.data == "string") {
          paymentHash = MakePaymentHash(tag.data)
        } else {
          return err(unknownLnInvoiceDecodeError)
        }
      }
      if (tag.tagName === "payment_secret") {
        if (typeof tag.data == "string") {
          paymentSecret = MakePaymentSecret(tag.data)
        } else {
          return err(unknownLnInvoiceDecodeError)
        }
      }
    })
    if (paymentHash.inner == "" || paymentSecret.inner == "") {
      return err(unknownLnInvoiceDecodeError)
    }
    return ok({paymentHash, paymentSecret})
  })
}

const MakePaymentHash = (inner: string): PaymentHash => {
  return {
    inner
  }
}

const MakePaymentSecret = (inner: string): PaymentSecret => {
  return {
    inner
  }
}

