import { SUBSCRIPTION_POLLING_INTERVAL, MS_IN_HOUR } from "@config/app"
import { MakePaymentStatusChecker } from "@core/payment-statu"
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
    const statusChecker = MakePaymentStatusChecker({ paymentRequest })

    const intervalId = setInterval(async () => {
      let result = await statusChecker.getStatus()

      if (result.isOk()) {
        let { status, paymentHash } = result.value
        if (status === "paid") {
          clearInterval(intervalId)
          const invoiceEventName = `LnInvoicePaymentStatus-${paymentHash.inner}`
          pubsub.publish(invoiceEventName, { errors: [], status: "PAID" })
        }
      } else {
        let error = result.error
        // translate and return the error
      }
    }, SUBSCRIPTION_POLLING_INTERVAL)

    setTimeout(() => {
      clearInterval(intervalId)
      pubsub.publish(invoiceEventName, { status: "TIMEOUT" })
    }, MS_IN_HOUR)

    return pubsub.asyncIterator([invoiceEventName])
  },
}

export default LnInvoicePaymentStatusSubscription
