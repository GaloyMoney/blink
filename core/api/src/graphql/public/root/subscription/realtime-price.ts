import crypto from "crypto"

import { Prices } from "@/app"

import { customPubSubTrigger, PubSubDefaultTriggers } from "@/domain/pubsub"
import {
  checkedToDisplayCurrency,
  majorToMinorUnit,
  SAT_PRICE_PRECISION_OFFSET,
  USD_PRICE_PRECISION_OFFSET,
  UsdDisplayCurrency,
} from "@/domain/fiat"

import { GT } from "@/graphql/index"
import { UnknownClientError } from "@/graphql/error"
import { mapAndParseErrorForGqlResponse } from "@/graphql/error-map"
import DisplayCurrencyGT from "@/graphql/shared/types/scalar/display-currency"
import RealtimePricePayload from "@/graphql/public/types/payload/realtime-price"

import { PubSubService } from "@/services/pubsub"
import { baseLogger } from "@/services/logger"

const pubsub = PubSubService()

const RealtimePriceInput = GT.Input({
  name: "RealtimePriceInput",
  fields: () => ({
    currency: {
      type: DisplayCurrencyGT,
      defaultValue: UsdDisplayCurrency,
    },
  }),
})

type RealtimePriceSubscribeArgs = {
  input: {
    currency: DisplayCurrency | Error
  }
}

const RealtimePriceSubscription = {
  type: GT.NonNull(RealtimePricePayload),
  description: "Returns the price of 1 satoshi",
  args: {
    input: { type: GT.NonNull(RealtimePriceInput) },
  },
  resolve: async (
    source:
      | {
          errors: IError[]
          timestamp?: Date
          pricePerSat?: number
          pricePerUsdCent?: number
          displayCurrency?: DisplayCurrency
        }
      | undefined,
    args: RealtimePriceSubscribeArgs,
  ) => {
    if (source === undefined) {
      throw new UnknownClientError({
        message:
          "Got 'undefined' payload. Check url used to ensure right websocket endpoint was used for subscription.",
        level: "fatal",
        logger: baseLogger,
      })
    }

    const { errors, timestamp, pricePerSat, pricePerUsdCent, displayCurrency } = source
    if (errors) return { errors: errors }
    if (!timestamp || !pricePerSat || !pricePerUsdCent || !displayCurrency) {
      return { errors: [{ message: "No price info" }] }
    }

    const { currency } = args.input
    if (currency instanceof Error) throw currency

    if (displayCurrency !== currency) {
      throw new UnknownClientError({
        message: "Got 'invalid' payload.",
        level: "fatal",
        logger: baseLogger,
      })
    }

    const minorUnitPerSat = majorToMinorUnit({
      amount: pricePerSat,
      displayCurrency: currency,
    })
    const minorUnitPerUsdCent = majorToMinorUnit({
      amount: pricePerUsdCent,
      displayCurrency: currency,
    })

    return {
      errors: [],
      realtimePrice: {
        timestamp: new Date(timestamp),
        denominatorCurrency: currency,
        btcSatPrice: {
          base: Math.round(minorUnitPerSat * 10 ** SAT_PRICE_PRECISION_OFFSET),
          offset: SAT_PRICE_PRECISION_OFFSET,
          currencyUnit: "MINOR",
        },
        usdCentPrice: {
          base: Math.round(minorUnitPerUsdCent * 10 ** USD_PRICE_PRECISION_OFFSET),
          offset: USD_PRICE_PRECISION_OFFSET,
          currencyUnit: "MINOR",
        },
      },
    }
  },
  subscribe: async (_: unknown, args: RealtimePriceSubscribeArgs) => {
    const { currency: displayCurrency } = args.input

    const immediateTrigger = customPubSubTrigger({
      event: PubSubDefaultTriggers.PriceUpdate,
      suffix: crypto.randomUUID(),
    })

    if (displayCurrency instanceof Error) {
      pubsub.publishDelayed({
        trigger: immediateTrigger,
        payload: { errors: [{ message: displayCurrency.message }] },
      })
      return pubsub.createAsyncIterator({ trigger: immediateTrigger })
    }

    const currencies = await Prices.listCurrencies()
    if (currencies instanceof Error) {
      pubsub.publishDelayed({
        trigger: immediateTrigger,
        payload: { errors: [mapAndParseErrorForGqlResponse(currencies)] },
      })
      return pubsub.createAsyncIterator({ trigger: immediateTrigger })
    }

    const priceCurrency = currencies.find((c) => displayCurrency === c.code)
    const checkedDisplayCurrency = checkedToDisplayCurrency(priceCurrency?.code)

    if (checkedDisplayCurrency instanceof Error) {
      pubsub.publishDelayed({
        trigger: immediateTrigger,
        payload: { errors: [{ message: "Unsupported exchange unit" }] },
      })
      return pubsub.createAsyncIterator({ trigger: immediateTrigger })
    }

    const pricePerSat = await Prices.getCurrentSatPrice({
      currency: checkedDisplayCurrency,
    })
    const pricePerUsdCent = await Prices.getCurrentUsdCentPrice({
      currency: checkedDisplayCurrency,
    })
    if (!(pricePerSat instanceof Error) && !(pricePerUsdCent instanceof Error)) {
      const { timestamp } = pricePerSat
      pubsub.publishDelayed({
        trigger: immediateTrigger,
        payload: {
          timestamp,
          displayCurrency,
          pricePerSat: pricePerSat.price,
          pricePerUsdCent: pricePerUsdCent.price,
        },
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

export default RealtimePriceSubscription
