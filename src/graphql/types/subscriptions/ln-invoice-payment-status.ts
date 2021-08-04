import { SUBSCRIPTION_POLLING_INTERVAL, MS_IN_HOUR } from "@config/app"
import { MakePaymentStatusChecker } from "@core/payment-status"
import { GT, pubsub } from "@graphql/index"

import LnInvoicePaymentRequest from "../scalars/ln-invoice-payment-request"
import LnInvoicePaymentStatusPayload from "../payloads/ln-invoice-payment-status"

const LnInvoicePaymentStatusInput = new GT.Input({
  name: "LnInvoicePaymentStatusInput",
  fields: () => ({
    paymentRequest: { type: GT.NonNull(LnInvoicePaymentRequest) },
    lookupToken: { type: GT.NonNull(GT.String) },
  }),
})

const LnInvoicePaymentStatusSubscription = {
  type: GT.NonNull(LnInvoicePaymentStatusPayload),

  args: {
    input: { type: GT.NonNull(LnInvoicePaymentStatusInput) },
  },

  resolve: (source) => {
    if (source.status === "TIMEOUT") {
      throw new Error("Operation timed out")
    }
    return source
  },

  subscribe: async (source, args, { logger }) => {
    const { paymentRequest, lookupToken } = args.input

    const errors: UserError[] = []
    const statusCheckerRes = MakePaymentStatusChecker({ paymentRequest })
    if (statusCheckerRes.isErr()) {
      errors.push({ message: statusCheckerRes.error.message })
    } else {
      const statusChecker = statusCheckerRes.value
      const invoiceEventName = `LnInvoicePaymentStatus-${statusChecker.paymentHash.inner}`

      const intervalId = setInterval(async () => {
        const result = await statusChecker.getStatus()

        if (result.isOk()) {
          const { status } = result.value
          if (status === "paid") {
            clearInterval(intervalId)
            pubsub.publish(invoiceEventName, { errors: [], status: "PAID" })
          }
        } else {
          const error = result.error
          // translate and return the error
        }
      }, SUBSCRIPTION_POLLING_INTERVAL)

      setTimeout(() => {
        clearInterval(intervalId)
        pubsub.publish(invoiceEventName, { status: "TIMEOUT" })
      }, MS_IN_HOUR)

      return pubsub.asyncIterator([invoiceEventName])
    }
  },
}

export default LnInvoicePaymentStatusSubscription
