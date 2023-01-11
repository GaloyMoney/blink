import crypto from "crypto"

import { SAT_PRICE_PRECISION_OFFSET } from "@config"

import { Prices } from "@app"

import { checkedToDisplayCurrency, DisplayCurrency } from "@domain/fiat"
import { customPubSubTrigger, PubSubDefaultTriggers } from "@domain/pubsub"

import { GT } from "@graphql/index"
import { mapError } from "@graphql/error-map"
import { UnknownClientError } from "@graphql/error"
import PricePayload from "@graphql/types/payload/price"

import { PubSubService } from "@services/pubsub"
import { baseLogger } from "@services/logger"

const pubsub = PubSubService()

const SatPriceInput = GT.Input({
  name: "SatPriceInput",
  fields: () => ({
    priceCurrencyUnit: { type: GT.NonNull(GT.String) },
  }),
})

type SatPriceSubscribeArgs = {
  input: {
    priceCurrencyUnit: string | Error
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
    const { priceCurrencyUnit } = args.input

    const immediateTrigger = customPubSubTrigger({
      event: PubSubDefaultTriggers.PriceUpdate,
      suffix: crypto.randomUUID(),
    })

    if (priceCurrencyUnit instanceof Error) {
      pubsub.publishImmediate({
        trigger: immediateTrigger,
        payload: { errors: [{ message: priceCurrencyUnit.message }] },
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

    const priceCurrency = currencies.find((c) => priceCurrencyUnit === `${c.code}CENT`)
    const displayCurrency = checkedToDisplayCurrency(priceCurrency?.code)

    if (displayCurrency instanceof Error) {
      pubsub.publishImmediate({
        trigger: immediateTrigger,
        payload: { errors: [{ message: "Unsupported exchange unit" }] },
      })
      return pubsub.createAsyncIterator({ trigger: immediateTrigger })
    }

    const pricePerSat = await Prices.getCurrentPrice({ currency: displayCurrency })
    if (!(pricePerSat instanceof Error)) {
      pubsub.publishImmediate({
        trigger: immediateTrigger,
        payload: { centsPerSat: 100 * pricePerSat, displayCurrency },
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
