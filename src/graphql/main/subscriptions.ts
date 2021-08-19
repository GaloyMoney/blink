import { GT } from "../index"

import LnInvoicePaymentStatusSubscription from "../types/subscription/ln-invoice-payment-status"

const SubscriptionType = new GT.Object({
  name: "Subscription",
  fields: () => ({
    lnInvoicePaymentStatus: LnInvoicePaymentStatusSubscription,
  }),
})

export default SubscriptionType
