import { GT } from "@graphql/index"

import PriceSubscription from "@graphql/root/subscription/price"
import LnInvoicePaymentStatusSubscription from "@graphql/root/subscription/ln-invoice-payment-status"

const SubscriptionType = new GT.Object({
  name: "Subscription",
  fields: () => ({
    price: PriceSubscription,
    lnInvoicePaymentStatus: LnInvoicePaymentStatusSubscription,
  }),
})

export default SubscriptionType
