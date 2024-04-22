import { Lightning } from "@/app"

import { customPubSubTrigger, PubSubDefaultTriggers } from "@/domain/pubsub"

import { PubSubService } from "@/services/pubsub"
import { baseLogger } from "@/services/logger"

import { GT } from "@/graphql/index"
import LnInvoicePaymentStatusPayload from "@/graphql/public/types/payload/ln-invoice-payment-status"
import LnInvoicePaymentStatusByHashInput from "@/graphql/public/types/object/ln-invoice-payment-status-by-hash-input"
import { UnknownClientError } from "@/graphql/error"
import { mapAndParseErrorForGqlResponse } from "@/graphql/error-map"
import { WalletInvoiceStatus } from "@/domain/wallet-invoices"

const pubsub = PubSubService()

type LnInvoicePaymentStatusByHashSubscribeArgs = {
  input: {
    paymentHash: PaymentHash | Error
  }
}

type LnInvoicePaymentStatusByHashResolveSource = {
  errors?: IError[]
  status?: string
  paymentHash?: PaymentHash
  paymentRequest?: EncodedPaymentRequest
}

const LnInvoicePaymentStatusByHashSubscription = {
  type: GT.NonNull(LnInvoicePaymentStatusPayload),
  args: {
    input: { type: GT.NonNull(LnInvoicePaymentStatusByHashInput) },
  },
  resolve: async (source: LnInvoicePaymentStatusByHashResolveSource | undefined) => {
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

  subscribe: async (
    _source: unknown,
    args: LnInvoicePaymentStatusByHashSubscribeArgs,
  ) => {
    const { paymentHash } = args.input
    if (paymentHash instanceof Error) throw paymentHash

    const paymentStatusChecker = await Lightning.PaymentStatusCheckerByHash({
      paymentHash,
    })
    if (paymentStatusChecker instanceof Error) {
      const lnPaymentStatusTrigger = customPubSubTrigger({
        event: PubSubDefaultTriggers.LnPaymentStatus,
        suffix: paymentHash,
      })
      pubsub.publishDelayed({
        trigger: lnPaymentStatusTrigger,
        payload: { errors: [mapAndParseErrorForGqlResponse(paymentStatusChecker)] },
      })

      return pubsub.createAsyncIterator({ trigger: lnPaymentStatusTrigger })
    }

    const paymentRequest = paymentStatusChecker.paymentRequest
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

export default LnInvoicePaymentStatusByHashSubscription
