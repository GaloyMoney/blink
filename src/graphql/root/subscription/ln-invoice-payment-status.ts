import { Lightning } from "@app"

import { customPubSubTrigger, PubSubDefaultTriggers } from "@domain/pubsub"

import { PubSubService } from "@services/pubsub"
import { baseLogger } from "@services/logger"

import { GT } from "@graphql/index"
import LnInvoicePaymentStatusPayload from "@graphql/types/payload/ln-invoice-payment-status"
import LnInvoicePaymentStatusInput from "@graphql/types/object/ln-invoice-payment-status-input"
import { UnknownClientError } from "@graphql/error"

const pubsub = PubSubService()

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

  resolve: (source: LnInvoicePaymentResolveSource | undefined) => {
    if (source === undefined) {
      throw new UnknownClientError({
        message:
          "Got 'undefined' payload. Check url used to ensure right websocket endpoint was used for subscription.",
        logger: baseLogger,
      })
    }

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
