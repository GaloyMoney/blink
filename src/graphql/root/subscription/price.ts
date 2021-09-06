import { GT, pubsub } from "@graphql/index"

import ExchangeCurrency from "@graphql/types/scalar/exchange-currency"
import PricePayload from "@graphql/types/payload/price"
import { getCurrentPrice } from "@services/realtime-price"

const PriceInput = new GT.Input({
  name: "PriceInput",
  fields: () => ({
    amount: { type: GT.NonNull(GT.Int) },
    amountCurrency: { type: GT.NonNull(ExchangeCurrency) },
    priceCurrentcy: { type: GT.NonNull(ExchangeCurrency) },
  }),
})

const PriceSubscription = {
  type: GT.NonNull(PricePayload),

  args: {
    input: { type: GT.NonNull(PriceInput) },
  },

  resolve: (source, args) => {
    if (source.errors) {
      return { errors: source.errors }
    }
    return { errors: [], price: args.input.amount * source.price }
  },

  subscribe: async (_, args) => {
    const { amountCurrency, priceCurrentcy } = args.input

    for (const input of [amountCurrency, priceCurrentcy]) {
      if (input instanceof Error) {
        return { errors: [{ message: input.message }] }
      }
    }

    const eventName = "SAT-USD-PRICE"

    // For now, keep the only supported exchange price as SAT -> USD
    if (amountCurrency !== "SAT" || priceCurrentcy !== "USD") {
      setImmediate(() =>
        pubsub.publish(eventName, {
          errors: [{ message: "Unsupported exchange price" }],
        }),
      )
    }

    const satUsdPrice = await getCurrentPrice()

    if (satUsdPrice) {
      setImmediate(() => {
        pubsub.publish(eventName, { price: satUsdPrice })
      })
    }

    return pubsub.asyncIterator([eventName])
  },
}

export default PriceSubscription
