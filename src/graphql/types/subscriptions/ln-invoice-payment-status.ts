import { SUBSCRIPTION_POLLING_INTERVAL, MS_PER_HOUR } from "@config/app"
import PaymentStatusChecker from "@core/lightning/payment-status-checker"
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

  resolve: (source) => source,

  subscribe: async (source, args) => {
    const { paymentRequest, lookupToken } = args.input

    const paymentStatusChecker = PaymentStatusChecker({ paymentRequest, lookupToken })

    const errors: UserError[] = []

    const eventName = `LnInvoicePaymentStatus-${paymentRequest}`

    if (paymentStatusChecker instanceof Error) {
      setImmediate(() =>
        pubsub.publish(eventName, {
          errors: [{ message: paymentStatusChecker.message }], // TODO: refine message
        }),
      )
      return pubsub.asyncIterator([eventName])
    }

    const intervalId = setInterval(async () => {
      if (errors.length > 0) {
        pubsub.publish(eventName, { errors })
        clearInterval(intervalId)
        return
      }

      const paid = await paymentStatusChecker.invoiceIsPaid()
      if (paid instanceof Error) {
        clearInterval(intervalId)
        pubsub.publish(eventName, { errors: [{ message: paid.message }] })
        return
      }
      if (paid) {
        clearInterval(intervalId)
        pubsub.publish(eventName, { errors: [], status: "PAID" })
      }
    }, SUBSCRIPTION_POLLING_INTERVAL)

    setTimeout(() => {
      clearInterval(intervalId)
      pubsub.publish(eventName, { errors: [{ message: "Operation timed out" }] })
    }, MS_PER_HOUR)

    return pubsub.asyncIterator([eventName])
  },
}

export default LnInvoicePaymentStatusSubscription
