import crypto from "crypto"

import { SAT_PRICE_PRECISION_OFFSET } from "@config"

import { Prices } from "@app"

import { checkedToDisplayCurrency, DisplayCurrency } from "@domain/fiat"
import { customPubSubTrigger, PubSubDefaultTriggers } from "@domain/pubsub"

import { GT } from "@graphql/index"
import { mapError } from "@graphql/error-map"
import { UnknownClientError } from "@graphql/error"
import PricePayload from "@graphql/types/payload/price"
import DisplayCurrencyGT from "@graphql/types/scalar/display-currency"

import { PubSubService } from "@services/pubsub"
import { baseLogger } from "@services/logger"

const pubsub = PubSubService()

const SatPriceInput = GT.Input({
  name: "SatPriceInput",
  fields: () => ({
    currency: { type: GT.NonNull(DisplayCurrencyGT), defaultValue: DisplayCurrency.Usd },
  }),
})

type SatPriceSubscribeArgs = {
  input: {
    currency: DisplayCurrency | Error
  }
}

const SatPriceSubscription = {
  type: GT.NonNull(PricePayload),
  description: "Returns the price of 1 satoshi",
  args: {
    input: { type: GT.NonNull(SatPriceInput) },
  },
  resolve: (
    source:
      | { errors: IError[]; centsPerSat?: number; displayCurrency?: DisplayCurrency }
      | undefined,
  ) => {
    if (source === undefined) {
      throw new UnknownClientError({
        message:
          "Got 'undefined' payload. Check url used to ensure right websocket endpoint was used for subscription.",
        level: "fatal",
        logger: baseLogger,
      })
    }

    const { errors, centsPerSat, displayCurrency } = source

    if (errors) return { errors: errors }
    if (!centsPerSat || !displayCurrency)
      return { errors: [{ message: "No price info" }] }

    return {
      errors: [],
      price: {
        formattedAmount: centsPerSat.toString(),
        base: Math.round(centsPerSat * 10 ** SAT_PRICE_PRECISION_OFFSET),
        offset: SAT_PRICE_PRECISION_OFFSET,
        currencyUnit: `${displayCurrency}CENT`,
      },
    }
  },
  subscribe: async (_: unknown, args: SatPriceSubscribeArgs) => {
    const { currency } = args.input

    const immediateTrigger = customPubSubTrigger({
      event: PubSubDefaultTriggers.PriceUpdate,
      suffix: crypto.randomUUID(),
    })

    if (currency instanceof Error) {
      pubsub.publishImmediate({
        trigger: immediateTrigger,
        payload: { errors: [{ message: currency.message }] },
      })
      return pubsub.createAsyncIterator({ trigger: immediateTrigger })
    }

    const currencies = await Prices.listCurrencies()
    if (currencies instanceof Error) {
      pubsub.publishImmediate({
        trigger: immediateTrigger,
        payload: { errors: [mapError(currencies)] },
      })
      return pubsub.createAsyncIterator({ trigger: immediateTrigger })
    }

    const priceCurrency = currencies.find((c) => currency === c.code)
    const displayCurrency = checkedToDisplayCurrency(priceCurrency?.code)

    if (displayCurrency instanceof Error) {
      pubsub.publishImmediate({
        trigger: immediateTrigger,
        payload: { errors: [{ message: "Unsupported exchange unit" }] },
      })
      return pubsub.createAsyncIterator({ trigger: immediateTrigger })
    }

    const pricePerSat = await Prices.getCurrentSatPrice({ currency: displayCurrency })
    if (!(pricePerSat instanceof Error)) {
      pubsub.publishImmediate({
        trigger: immediateTrigger,
        payload: { centsPerSat: 100 * pricePerSat.price, displayCurrency },
      })
    }

    const priceUpdateTrigger = customPubSubTrigger({
      event: PubSubDefaultTriggers.PriceUpdate,
      suffix: displayCurrency,
    })

    return pubsub.createAsyncIterator({
      trigger: [immediateTrigger, priceUpdateTrigger],
    })
  },
}

export default SatPriceSubscription
