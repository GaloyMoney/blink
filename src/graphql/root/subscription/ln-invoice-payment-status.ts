import { GT, pubsub } from "@graphql/index"

import { getPaymentHashFromRequest } from "@app/lightning"
import LnPaymentRequest from "@graphql/types/scalar/ln-payment-request"
import LnInvoicePaymentStatusPayload from "@graphql/types/payload/ln-invoice-payment-status"

const LnInvoicePaymentStatusInput = new GT.Input({
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

  subscribe: async (source, args) => {
    const { paymentRequest } = args.input

    const paymentHash = getPaymentHashFromRequest(paymentRequest)

    const eventName = `LNINVOICE-PAYMENT-STATUS-${paymentHash}`

    if (paymentHash instanceof Error) {
      setImmediate(() =>
        pubsub.publish(eventName, {
          errors: [{ message: paymentHash.message }], // TODO: refine message
        }),
      )
      return pubsub.asyncIterator([eventName])
    }

    return pubsub.asyncIterator(eventName)
  },
}

export default LnInvoicePaymentStatusSubscription
