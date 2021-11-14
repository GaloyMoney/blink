import { GT } from "@graphql/index"

import PriceSubscription from "@graphql/root/subscription/price"
import LnInvoicePaymentStatusSubscription from "@graphql/root/subscription/ln-invoice-payment-status"
import MeSubscription from "@graphql/root/subscription/me"

const SubscriptionType = new GT.Object({
  name: "Subscription",
  fields: () => ({
    me: MeSubscription,
    price: PriceSubscription,
    lnInvoicePaymentStatus: LnInvoicePaymentStatusSubscription,
  }),
})

export default SubscriptionType
