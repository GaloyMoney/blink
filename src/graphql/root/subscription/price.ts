import crypto from "crypto"

import { GT } from "@graphql/index"
import ExchangeCurrencyUnit from "@graphql/types/scalar/exchange-currency-unit"
import PricePayload from "@graphql/types/payload/price"
import { SAT_PRICE_PRECISION_OFFSET, SAT_USDCENT_PRICE } from "@config"
import SatAmount from "@graphql/types/scalar/sat-amount"
import pubsub from "@services/pubsub"
import { Prices } from "@app"

const PriceInput = GT.Input({
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
        base: Math.round(amountPriceInCents * 10 ** SAT_PRICE_PRECISION_OFFSET),
        offset: SAT_PRICE_PRECISION_OFFSET,
        currencyUnit: "USDCENT",
      },
    }
  },
  subscribe: async (_, args) => {
    const { amount, amountCurrencyUnit, priceCurrencyUnit } = args.input

    const eventName = SAT_USDCENT_PRICE
    const immediateEventName = `SAT_USDCENT_PRICE_${crypto.randomUUID()}`

    for (const input of [amountCurrencyUnit, priceCurrencyUnit]) {
      if (input instanceof Error) {
        pubsub.publishImmediate(immediateEventName, {
          errors: [{ message: input.message }],
        })
        return pubsub.asyncIterator(immediateEventName)
      }
    }

    if (amountCurrencyUnit !== "BTCSAT" || priceCurrencyUnit !== "USDCENT") {
      // For now, keep the only supported exchange price as SAT -> USD
      pubsub.publishImmediate(immediateEventName, {
        errors: [{ message: "Unsupported exchange unit" }],
      })
    } else if (amount >= 1000000) {
      // SafeInt limit, reject for now
      pubsub.publishImmediate(immediateEventName, {
        errors: [{ message: "Unsupported exchange amount" }],
      })
    } else {
      const satUsdPrice = await Prices.getCurrentPrice()
      if (!(satUsdPrice instanceof Error)) {
        pubsub.publishImmediate(immediateEventName, {
          satUsdCentPrice: 100 * satUsdPrice,
        })
      }
      return pubsub.asyncIterator([immediateEventName, eventName])
    }

    return pubsub.asyncIterator(immediateEventName)
  },
}

export default PriceSubscription
