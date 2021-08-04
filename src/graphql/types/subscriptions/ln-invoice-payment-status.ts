import { SUBSCRIPTION_POLLING_INTERVAL, MS_IN_HOUR } from "@config/app"
import LnInvoiceThunk from "@core/lightning/invoice"
import { GT, pubsub } from "@graphql/index"

import LnInvoicePaymentRequest from "../scalars/ln-invoice-payment-request"
import LnInvoicePaymentStatusPayload from "../payloads/ln-invoice-payment-status"

const LnInvoicePaymentStatusInput = new GT.Input({
  name: "LnInvoicePaymentStatusInput",
  fields: () => ({
    paymentRequest: { type: GT.NonNull(LnInvoicePaymentRequest) },
    lookupToken: { type: GT.NonNull(GT.String) },
  }),
})

const LnInvoicePaymentStatusSubscription = {
  type: GT.NonNull(LnInvoicePaymentStatusPayload),

  args: {
    input: { type: GT.NonNull(LnInvoicePaymentStatusInput) },
  },

  resolve: (source) => {
    if (source.status === "TIMEOUT") {
      throw new Error("Operation timed out")
    }
    return source
  },

  subscribe: async (source, args, { logger }) => {
    const { paymentRequest, lookupToken } = args.input

    const LnInvoice = LnInvoiceThunk({ logger })

    const { paymentHash, paymentSecret } = await LnInvoice.decode(paymentRequest)
    const errors: UserError[] = []

    // TODO: Improve this check with a non public payment secret
    if (paymentSecret !== lookupToken) {
      errors.push({
        message: "Invalid invoice data",
      })
    }

    const invoiceEventName = `LnInvoicePaymentStatus-${paymentHash}`

    const intervalId = setInterval(async () => {
      const { paid } = await LnInvoice.findByHash(paymentHash)

      if (paid) {
        clearInterval(intervalId)
        pubsub.publish(invoiceEventName, { errors: [], status: "PAID" })
      }
    }, SUBSCRIPTION_POLLING_INTERVAL)

    setTimeout(() => {
      clearInterval(intervalId)
      pubsub.publish(invoiceEventName, { status: "TIMEOUT" })
    }, MS_IN_HOUR)

    return pubsub.asyncIterator([invoiceEventName])
  },
}

export default LnInvoicePaymentStatusSubscription
