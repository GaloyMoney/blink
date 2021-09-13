import { GT, pubsub } from "@graphql/index"

import { getPaymentHashFromRequest } from "@app/lightning"
import LnPaymentRequest from "@graphql/types/scalar/ln-payment-request"
import LnInvoicePaymentStatusPayload from "@graphql/types/payload/ln-invoice-payment-status"
import { lnPaymentStatusEvent } from "@config/app"

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

  subscribe: async (_, args) => {
    const { paymentRequest } = args.input

    const paymentHash = getPaymentHashFromRequest(paymentRequest)

    if (paymentHash instanceof Error) {
      setImmediate(() =>
        pubsub.publish(paymentRequest, {
          errors: [{ message: paymentHash.message }], // TODO: refine message
        }),
      )
      return pubsub.asyncIterator(paymentRequest)
    }

    const eventName = lnPaymentStatusEvent(paymentHash)
    return pubsub.asyncIterator(eventName)
  },
}

export default LnInvoicePaymentStatusSubscription
