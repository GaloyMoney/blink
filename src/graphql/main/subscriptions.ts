import { GT } from "@graphql/index"

import PriceSubscription from "@graphql/root/subscription/price"
import LnInvoicePaymentStatusSubscription from "@graphql/root/subscription/ln-invoice-payment-status"
import MyUpdatesSubscription from "@graphql/root/subscription/my-updates"

const SubscriptionType = GT.Object({
  name: "Subscription",
  fields: () => ({
    myUpdates: MyUpdatesSubscription,
    price: PriceSubscription,
    lnInvoicePaymentStatus: LnInvoicePaymentStatusSubscription,
  }),
})

export default SubscriptionType
