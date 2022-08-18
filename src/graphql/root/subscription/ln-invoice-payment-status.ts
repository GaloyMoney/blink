import { GT } from "@graphql/index"
import LnPaymentRequest from "@graphql/types/scalar/ln-payment-request"
import LnInvoicePaymentStatusPayload from "@graphql/types/payload/ln-invoice-payment-status"

import { Lightning } from "@app"
import { PubSubService } from "@services/pubsub"
import { customPubSubTrigger, PubSubDefaultTriggers } from "@domain/pubsub"

const pubsub = PubSubService()

const LnInvoicePaymentStatusInput = GT.Input({
  name: "LnInvoicePaymentStatusInput",
  fields: () => ({
    paymentRequest: { type: GT.NonNull(LnPaymentRequest) },
  }),
})

type LnInvoicePaymentSubscribeArgs = {
  input: {
    paymentRequest: string | Error
  }
}

type LnInvoicePaymentResolveSource = {
  errors?: IError[]
  status?: string
}

const LnInvoicePaymentStatusSubscription = {
  type: GT.NonNull(LnInvoicePaymentStatusPayload),

  args: {
    input: { type: GT.NonNull(LnInvoicePaymentStatusInput) },
  },

  resolve: (source: LnInvoicePaymentResolveSource) => {
    if (source.errors) {
      return { errors: source.errors }
    }
    return {
      errors: [],
      status: source.status,
    }
  },

  subscribe: async (_source: unknown, args: LnInvoicePaymentSubscribeArgs) => {
    const { paymentRequest } = args.input
    if (paymentRequest instanceof Error) throw paymentRequest

    const paymentStatusChecker = await Lightning.PaymentStatusChecker(paymentRequest)

    if (paymentStatusChecker instanceof Error) {
      const lnPaymentStatusTrigger = customPubSubTrigger({
        event: PubSubDefaultTriggers.LnPaymentStatus,
        suffix: paymentRequest,
      })
      pubsub.publishImmediate({
        trigger: lnPaymentStatusTrigger,
        payload: { errors: [{ message: paymentStatusChecker.message }] },
      })

      return pubsub.createAsyncIterator({ trigger: lnPaymentStatusTrigger })
    }

    const trigger = customPubSubTrigger({
      event: PubSubDefaultTriggers.LnPaymentStatus,
      suffix: paymentStatusChecker.paymentHash,
    })
    const paid = await paymentStatusChecker.invoiceIsPaid()

    if (paid instanceof Error) {
      pubsub.publishImmediate({
        trigger,
        payload: { errors: [{ message: paid.message }] },
      })
    }

    if (paid) {
      pubsub.publishImmediate({ trigger, payload: { status: "PAID" } })
    }

    return pubsub.createAsyncIterator({ trigger })
  },
}

export default LnInvoicePaymentStatusSubscription
