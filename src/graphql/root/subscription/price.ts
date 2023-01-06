import crypto from "crypto"

import { SAT_PRICE_PRECISION_OFFSET } from "@config"

import { Prices } from "@app"

import { checkedToDisplayCurrency, DisplayCurrency } from "@domain/fiat"
import { customPubSubTrigger, PubSubDefaultTriggers } from "@domain/pubsub"

import { GT } from "@graphql/index"
import { UnknownClientError } from "@graphql/error"
import PricePayload from "@graphql/types/payload/price"
import SatAmount from "@graphql/types/scalar/sat-amount"
import ExchangeCurrencyUnit from "@graphql/types/scalar/exchange-currency-unit"

import { PubSubService } from "@services/pubsub"
import { baseLogger } from "@services/logger"

const pubsub = PubSubService()

const PriceInput = GT.Input({
  name: "PriceInput",
  fields: () => ({
    amount: { type: GT.NonNull(SatAmount) },
    amountCurrencyUnit: { type: GT.NonNull(ExchangeCurrencyUnit) },
    priceCurrencyUnit: { type: GT.NonNull(GT.String) },
  }),
})

type PriceSubscribeArgs = {
  input: {
    amount: number | Error
    amountCurrencyUnit: string | Error
    priceCurrencyUnit: string | Error
  }
}

type PriceResolveArgs = {
  input: {
    amount: number
    amountCurrencyUnit: string
    priceCurrencyUnit: string
  }
}

const PriceSubscription = {
  type: GT.NonNull(PricePayload),
  args: {
    input: { type: GT.NonNull(PriceInput) },
  },
  resolve: (
    source:
      | { errors: IError[]; centsPerSat?: number; displayCurrency?: DisplayCurrency }
      | undefined,
    args: PriceResolveArgs,
  ) => {
    if (source === undefined) {
      throw new UnknownClientError({
        message:
          "Got 'undefined' payload. Check url used to ensure right websocket endpoint was used for subscription.",
        level: "fatal",
        logger: baseLogger,
      })
    }

    if (source.errors) return { errors: source.errors }
    if (!source.centsPerSat || !source.displayCurrency)
      return { errors: [{ message: "No price info" }] }

    const amountPriceInCents = args.input.amount * source.centsPerSat
    return {
      errors: [],
      price: {
        formattedAmount: amountPriceInCents.toString(),
        base: Math.round(amountPriceInCents * 10 ** SAT_PRICE_PRECISION_OFFSET),
        offset: SAT_PRICE_PRECISION_OFFSET,
        currencyUnit: `${source.displayCurrency}CENT`,
      },
    }
  },
  subscribe: async (_: unknown, args: PriceSubscribeArgs) => {
    const { amount, amountCurrencyUnit, priceCurrencyUnit } = args.input

    const immediateTrigger = customPubSubTrigger({
      event: PubSubDefaultTriggers.PriceUpdate,
      suffix: crypto.randomUUID(),
    })

    for (const input of [amountCurrencyUnit, priceCurrencyUnit]) {
      if (input instanceof Error) {
        pubsub.publishImmediate({
          trigger: immediateTrigger,
          payload: { errors: [{ message: input.message }] },
        })
        return pubsub.createAsyncIterator({ trigger: immediateTrigger })
      }
    }

    const currencies = await Prices.listCurrencies()
    if (currencies instanceof Error) {
      pubsub.publishImmediate({
        trigger: immediateTrigger,
        payload: { errors: [{ message: currencies.message }] },
      })
      return pubsub.createAsyncIterator({ trigger: immediateTrigger })
    }

    const priceCurrency = currencies.find((c) => priceCurrencyUnit === `${c.code}CENT`)
    const displayCurrency = checkedToDisplayCurrency(priceCurrency?.code)

    if (amountCurrencyUnit !== "BTCSAT" || displayCurrency instanceof Error) {
      // For now, keep the only supported exchange price as SAT -> USD
      pubsub.publishImmediate({
        trigger: immediateTrigger,
        payload: { errors: [{ message: "Unsupported exchange unit" }] },
      })
    } else if (amount >= 1000000) {
      // SafeInt limit, reject for now
      pubsub.publishImmediate({
        trigger: immediateTrigger,
        payload: { errors: [{ message: "Unsupported exchange amount" }] },
      })
    } else {
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
    }

    return pubsub.createAsyncIterator({ trigger: immediateTrigger })
  },
}

export default PriceSubscription
