import { GT } from "../index"

import LnInvoicePaymentStatusSubscription from "../types/subscriptions/ln-invoice-payment-status"

const SubscriptionType = new GT.Object({
  name: "Subscription",
  fields: () => ({
    lnInvoicePaymentStatus: LnInvoicePaymentStatusSubscription,
  }),
})

export default SubscriptionType
