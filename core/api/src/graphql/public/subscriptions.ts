import { GT } from "@/graphql/index"

import PriceSubscription from "@/graphql/public/root/subscription/price"
import MyUpdatesSubscription from "@/graphql/public/root/subscription/my-updates"
import RealtimePriceSubscription from "@/graphql/public/root/subscription/realtime-price"
import LnInvoicePaymentStatusSubscription from "@/graphql/public/root/subscription/ln-invoice-payment-status"
import LnInvoicePaymentStatusByHashSubscription from "@/graphql/public/root/subscription/ln-invoice-payment-status-by-hash"
import LnInvoicePaymentStatusByPaymentRequestSubscription from "@/graphql/public/root/subscription/ln-invoice-payment-status-by-payment-request"
import {
  ACCOUNT_USERNAME,
  addAttributesToCurrentSpan,
  SemanticAttributes,
} from "@/services/tracing"

const fields = {
  myUpdates: MyUpdatesSubscription,
  price: PriceSubscription,
  realtimePrice: RealtimePriceSubscription,
  lnInvoicePaymentStatus: LnInvoicePaymentStatusSubscription,
  lnInvoicePaymentStatusByHash: LnInvoicePaymentStatusByHashSubscription,
  lnInvoicePaymentStatusByPaymentRequest:
    LnInvoicePaymentStatusByPaymentRequestSubscription,
}

const addTracing = () => {
  for (const key in fields) {
    // @ts-ignore-next-line no-implicit-any error
    const original = fields[key].resolve
    /* eslint @typescript-eslint/ban-ts-comment: "off" */
    // @ts-ignore-next-line no-implicit-any error
    fields[key].resolve = (source, args, context: GraphQLPublicContextForUser, info) => {
      const { ip, domainAccount } = context
      addAttributesToCurrentSpan({
        [SemanticAttributes.ENDUSER_ID]: domainAccount?.id,
        [ACCOUNT_USERNAME]: domainAccount?.username,
        [SemanticAttributes.HTTP_CLIENT_IP]: ip,
      })
      return original(source, args, context, info)
    }
  }
  return fields
}

export const SubscriptionType = GT.Object({
  name: "Subscription",
  fields: addTracing(),
})
