import { GT, pubsub } from "@graphql/index"

import ExchangeCurrencyUnit from "@graphql/types/scalar/exchange-currency-unit"
import PricePayload from "@graphql/types/payload/price"
import { getCurrentPrice } from "@services/realtime-price"

const PriceInput = new GT.Input({
  name: "PriceInput",
  fields: () => ({
    amount: { type: GT.NonNull(GT.Int) },
    amountCurrencyUnit: { type: GT.NonNull(ExchangeCurrencyUnit) },
    priceCurrencyUnit: { type: GT.NonNull(ExchangeCurrencyUnit) },
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
    const amountPriceInCents = args.input.amount * source.satUsdCentPrice
    return {
      errors: [],
      price: {
        formattedAmount: amountPriceInCents.toString(),
        base: Math.round(amountPriceInCents * 10 ** 16),
        offset: 16,
        currencyUnit: "USDCENT",
      },
    }
  },
  subscribe: async (_, args) => {
    const { amountCurrencyUnit, priceCurrencyUnit } = args.input

    for (const input of [amountCurrencyUnit, priceCurrencyUnit]) {
      if (input instanceof Error) {
        return { errors: [{ message: input.message }] }
      }
    }

    const eventName = "SAT-USDCENT-PRICE"

    // For now, keep the only supported exchange price as SAT -> USD
    if (amountCurrencyUnit !== "BTCSAT" || priceCurrencyUnit !== "USDCENT") {
      setImmediate(() =>
        pubsub.publish(eventName, {
          errors: [{ message: "Unsupported exchange price" }],
        }),
      )
      return pubsub.asyncIterator(eventName)
    }

    const satUsdPrice = await getCurrentPrice()

    if (satUsdPrice) {
      setTimeout(
        () => pubsub.publish(eventName, { satUsdCentPrice: 100 * satUsdPrice }),
        1000,
      )
    }

    return pubsub.asyncIterator(eventName)
  },
}

export default PriceSubscription
