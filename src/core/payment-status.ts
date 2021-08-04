import { okAsync, errAsync, ResultAsync } from "neverthrow"
import { InvoiceUser } from "@services/mongoose/schema"
import { decodeInvoice } from "@domain/ln-invoice"
import { toTypedError } from "@domain/utils"

export const MakePaymentStatusChecker = ({ paymentRequest }): PaymentStatusChecker => {
  const decodedInvoice = decodeInvoice(paymentRequest)
  const getStatus = (): ResultAsync<PaymentStatus, PaymentStatusError> => {
    return decodedInvoice
      .asyncAndThen(({ paymentHash }) => findUserInvoice(paymentHash))
      .map((invoice) => ({
        paymentHash: invoice._id,
        status: invoice.paid ? "paid" : "pending",
      }))
  }

  return {
    getStatus,
  }
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
const unknownInvoiceLookupError = toInvoiceLookupError({})
