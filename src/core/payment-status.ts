import { ok, err, Result, ResultAsync } from "neverthrow"
import { InvoiceUser } from "@services/mongoose/schema"
import { decodeInvoice } from "@domain/ln-invoice"
import { toTypedError } from "@domain/utils"

export const MakePaymentStatusChecker = ({
  paymentRequest,
}): Result<PaymentStatusChecker, LnInvoiceDecodeError> => {
  const decodedInvoice = decodeInvoice(paymentRequest)
  if (decodedInvoice.isErr()) {
    return err(decodedInvoice.error)
  }

  const paymentHash = decodedInvoice.value.paymentHash
  const getStatus = (): ResultAsync<PaymentStatus, InvoiceLookupError> => {
    return findUserInvoice(paymentHash).map((invoice) =>
      invoice.paid ? "paid" : "pending",
    )
  }

  return ok({ paymentHash, getStatus })
}

// Belongs in src/services/mongoose or something like that
const findUserInvoice = (
  paymentHash: PaymentHash,
): ResultAsync<any, InvoiceLookupError> => {
  return ResultAsync.fromPromise(
    InvoiceUser.findOne({ _id: paymentHash.inner }),
    toInvoiceLookupError,
  )
}

const toInvoiceLookupError: ErrorConverter<InvoiceLookupErrorType> = toTypedError({
  _type: "InvoiceLookupError",
  unknownMessage: "Unknown error while looking up invoice",
})
