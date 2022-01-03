import { GT } from "@graphql/index"

import { Lightning } from "@app"
import LnPaymentRequest from "@graphql/types/scalar/ln-payment-request"
import LnInvoicePaymentStatusPayload from "@graphql/types/payload/ln-invoice-payment-status"
import pubsub from "@services/pubsub"
import { lnPaymentStatusEvent } from "@domain/bitcoin/lightning"

const LnInvoicePaymentStatusInput = GT.Input({
  name: "LnInvoicePaymentStatusInput",
  fields: () => ({
    paymentRequest: { type: GT.NonNull(LnPaymentRequest) },
  }),
})

const LnInvoicePaymentStatusSubscription = {
  type: GT.NonNull(LnInvoicePaymentStatusPayload),

  args: {
    input: { type: GT.NonNull(LnInvoicePaymentStatusInput) },
  },

  resolve: (source) => {
    if (source.errors) {
      return { errors: source.errors }
    }
    return {
      errors: [],
      status: source.status,
    }
  },

  subscribe: async (_, args) => {
    const { paymentRequest } = args.input

    const paymentStatusChecker = await Lightning.PaymentStatusChecker({ paymentRequest })

    if (paymentStatusChecker instanceof Error) {
      pubsub.publishImmediate(paymentRequest, {
        errors: [{ message: paymentStatusChecker.message }], // TODO: refine message
      })
      return pubsub.asyncIterator(paymentRequest)
    }

    const eventName = lnPaymentStatusEvent(paymentStatusChecker.paymentHash)
    const paid = await paymentStatusChecker.invoiceIsPaid()

    if (paid instanceof Error) {
      pubsub.publishImmediate(eventName, { errors: [{ message: paid.message }] })
    }

    if (paid) {
      pubsub.publishImmediate(eventName, { status: "PAID" })
    }

    return pubsub.asyncIterator(eventName)
  },
}

export default LnInvoicePaymentStatusSubscription
