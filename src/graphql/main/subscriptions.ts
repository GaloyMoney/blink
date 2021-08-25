import { GT } from "@graphql/index"

import LnInvoicePaymentStatusSubscription from "@graphql/root/subscription/ln-invoice-payment-status"

const SubscriptionType = new GT.Object({
  name: "Subscription",
  fields: () => ({
    lnInvoicePaymentStatus: LnInvoicePaymentStatusSubscription,
  }),
})

export default SubscriptionType
