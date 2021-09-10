import { GT, pubsub } from "@graphql/index"

import ExchangeCurrencyUnit from "@graphql/types/scalar/exchange-currency-unit"
import PricePayload from "@graphql/types/payload/price"
import { getCurrentPrice } from "@services/realtime-price"
import { SAT_USDCENT_PRICE } from "@config/app"
import SatAmount from "@graphql/types/scalar/sat-amount"

const PriceInput = new GT.Input({
  name: "PriceInput",
  fields: () => ({
    amount: { type: GT.NonNull(SatAmount) },
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
        base: Math.round(amountPriceInCents * 10 ** 12),
        offset: 12,
        currencyUnit: "USDCENT",
      },
    }
  },
  subscribe: async (_, args) => {
    const { amount, amountCurrencyUnit, priceCurrencyUnit } = args.input

    for (const input of [amountCurrencyUnit, priceCurrencyUnit]) {
      if (input instanceof Error) {
        return { errors: [{ message: input.message }] }
      }
    }

    const eventName = SAT_USDCENT_PRICE

    // For now, keep the only supported exchange price as SAT -> USD
    if (amountCurrencyUnit !== "BTCSAT" || priceCurrencyUnit !== "USDCENT") {
      setImmediate(() =>
        pubsub.publish(eventName, {
          errors: [{ message: "Unsupported exchange unit" }],
        }),
      )
      return pubsub.asyncIterator(eventName)
    }

    if (amount >= 1000000) {
      // SafeInt limit, reject for now
      setImmediate(() =>
        pubsub.publish(eventName, {
          errors: [{ message: "Unsupported exchange amount" }],
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
