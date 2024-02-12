import { Lightning } from "@/app"

import { customPubSubTrigger, PubSubDefaultTriggers } from "@/domain/pubsub"

import { PubSubService } from "@/services/pubsub"
import { baseLogger } from "@/services/logger"

import { GT } from "@/graphql/index"
import LnInvoicePaymentStatusPayload from "@/graphql/public/types/payload/ln-invoice-payment-status"
import LnInvoicePaymentStatusInput from "@/graphql/public/types/object/ln-invoice-payment-status-input"
import { UnknownClientError } from "@/graphql/error"
import { mapAndParseErrorForGqlResponse } from "@/graphql/error-map"
import { WalletInvoiceStatus } from "@/domain/wallet-invoices"

const pubsub = PubSubService()

type LnInvoicePaymentSubscribeArgs = {
  input: {
    paymentRequest: EncodedPaymentRequest | Error
  }
}

type LnInvoicePaymentResolveSource = {
  errors?: IError[]
  status?: string
  paymentHash?: PaymentHash
  paymentRequest?: EncodedPaymentRequest
}

const LnInvoicePaymentStatusSubscription = {
  type: GT.NonNull(LnInvoicePaymentStatusPayload),
  deprecationReason: "Deprecated in favor of lnInvoicePaymentStatusByRequest",
  args: {
    input: { type: GT.NonNull(LnInvoicePaymentStatusInput) },
  },
  resolve: async (source: LnInvoicePaymentResolveSource | undefined) => {
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

    let paymentRequest = source.paymentRequest
    if (source.paymentHash && !source.paymentRequest) {
      const invoice = await Lightning.getInvoiceRequestByHash({
        paymentHash: source.paymentHash,
      })
      paymentRequest = invoice instanceof Error ? paymentRequest : invoice
    }
    return {
      errors: [],
      status: source.status,
      paymentHash: source.paymentHash,
      paymentRequest,
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
      pubsub.publishDelayed({
        trigger: lnPaymentStatusTrigger,
        payload: { errors: [mapAndParseErrorForGqlResponse(paymentStatusChecker)] },
      })

      return pubsub.createAsyncIterator({ trigger: lnPaymentStatusTrigger })
    }

    const paymentHash = paymentStatusChecker.paymentHash
    const trigger = customPubSubTrigger({
      event: PubSubDefaultTriggers.LnPaymentStatus,
      suffix: paymentHash,
    })
    const paid = await paymentStatusChecker.invoiceIsPaid()

    if (paid instanceof Error) {
      pubsub.publishDelayed({
        trigger,
        payload: { errors: [mapAndParseErrorForGqlResponse(paid)] },
      })
    }

    if (paid) {
      pubsub.publishDelayed({
        trigger,
        payload: { paymentHash, paymentRequest, status: WalletInvoiceStatus.Paid },
      })
      return pubsub.createAsyncIterator({ trigger })
    }

    const status = paymentStatusChecker.isExpired
      ? WalletInvoiceStatus.Expired
      : WalletInvoiceStatus.Pending
    pubsub.publishDelayed({ trigger, payload: { paymentHash, paymentRequest, status } })

    if (!paymentStatusChecker.isExpired) {
      const timeout = Math.max(paymentStatusChecker.expiresAt.getTime() - Date.now(), 0)
      setTimeout(() => {
        pubsub.publish({
          trigger,
          payload: { paymentHash, paymentRequest, status: WalletInvoiceStatus.Expired },
        })
      }, timeout + 1000)
    }

    return pubsub.createAsyncIterator({ trigger })
  },
}

export default LnInvoicePaymentStatusSubscription
