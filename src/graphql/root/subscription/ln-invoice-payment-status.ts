import { GT, pubsub } from "@graphql/index"

import { PaymentStatusChecker } from "@app/lightning"
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

    const paymentStatusChecker = PaymentStatusChecker({ paymentRequest })

    if (paymentStatusChecker instanceof Error) {
      pubsub.setPublish(paymentRequest, {
        errors: [{ message: paymentStatusChecker.message }], // TODO: refine message
      })
      return pubsub.asyncIterator(paymentRequest)
    }

    const eventName = lnPaymentStatusEvent(paymentStatusChecker.paymentHash)
    const paid = await paymentStatusChecker.invoiceIsPaid()

    if (paid instanceof Error) {
      pubsub.setPublish(eventName, { errors: [{ message: paid.message }] })
    }

    if (paid) {
      pubsub.setPublish(eventName, { status: "PAID" })
    }

    return pubsub.asyncIterator(eventName)
  },
}

export default LnInvoicePaymentStatusSubscription
