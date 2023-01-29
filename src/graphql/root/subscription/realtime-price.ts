import crypto from "crypto"

import { SAT_PRICE_PRECISION_OFFSET, USD_PRICE_PRECISION_OFFSET } from "@config"

import { Prices } from "@app"

import { WalletCurrency } from "@domain/shared"
import { checkedToDisplayCurrency, DisplayCurrency } from "@domain/fiat"
import { customPubSubTrigger, PubSubDefaultTriggers } from "@domain/pubsub"

import { GT } from "@graphql/index"
import { mapError } from "@graphql/error-map"
import { UnknownClientError } from "@graphql/error"
import WalletCurrencyGT from "@graphql/types/scalar/wallet-currency"
import DisplayCurrencyGT from "@graphql/types/scalar/display-currency"
import RealtimePricePayload from "@graphql/types/payload/realtime-price"

import { PubSubService } from "@services/pubsub"
import { baseLogger } from "@services/logger"

const pubsub = PubSubService()

const RealtimePriceInput = GT.Input({
  name: "RealtimePriceInput",
  fields: () => ({
    walletCurrency: {
      type: GT.NonNull(WalletCurrencyGT),
      defaultValue: WalletCurrency.Btc,
    },
    displayCurrency: {
      type: GT.NonNull(DisplayCurrencyGT),
      defaultValue: DisplayCurrency.Usd,
    },
  }),
})

type RealtimePriceSubscribeArgs = {
  input: {
    walletCurrency: WalletCurrency | Error
    displayCurrency: DisplayCurrency | Error
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
          centsPerSat?: number
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

    const { errors, timestamp, centsPerSat, displayCurrency } = source
    if (errors) return { errors: errors }
    if (!timestamp || !centsPerSat || !displayCurrency) {
      return { errors: [{ message: "No price info" }] }
    }

    const { walletCurrency, displayCurrency: displayCurrencyInput } = args.input
    if (walletCurrency instanceof Error) throw walletCurrency
    if (displayCurrencyInput instanceof Error) throw displayCurrency

    if (displayCurrency !== displayCurrencyInput) {
      throw new UnknownClientError({
        message: "Got 'invalid' payload.",
        level: "fatal",
        logger: baseLogger,
      })
    }

    let price: number = centsPerSat
    let offset = SAT_PRICE_PRECISION_OFFSET
    if (walletCurrency === WalletCurrency.Usd) {
      const satUsdPrice = await Prices.getCurrentPrice({ currency: DisplayCurrency.Usd })
      if (satUsdPrice instanceof Error) {
        return { errors: [mapError(satUsdPrice)] }
      }

      price = centsPerSat / 100 / satUsdPrice.price
      offset = USD_PRICE_PRECISION_OFFSET
    }

    return {
      errors: [],
      price: {
        timestamp: new Date(timestamp),
        base: Math.round(price * 10 ** offset),
        offset,
        walletCurrency,
        displayCurrency,
        currencyUnit: `${displayCurrency}CENT`,
        formattedAmount: price.toFixed(8),
      },
    }
  },
  subscribe: async (_: unknown, args: RealtimePriceSubscribeArgs) => {
    const { walletCurrency, displayCurrency } = args.input

    const immediateTrigger = customPubSubTrigger({
      event: PubSubDefaultTriggers.PriceUpdate,
      suffix: crypto.randomUUID(),
    })

    if (walletCurrency instanceof Error) {
      pubsub.publishImmediate({
        trigger: immediateTrigger,
        payload: { errors: [{ message: walletCurrency.message }] },
      })
      return pubsub.createAsyncIterator({ trigger: immediateTrigger })
    }

    if (displayCurrency instanceof Error) {
      pubsub.publishImmediate({
        trigger: immediateTrigger,
        payload: { errors: [{ message: displayCurrency.message }] },
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

    const priceCurrency = currencies.find((c) => displayCurrency === c.code)
    const checkedDisplayCurrency = checkedToDisplayCurrency(priceCurrency?.code)

    if (checkedDisplayCurrency instanceof Error) {
      pubsub.publishImmediate({
        trigger: immediateTrigger,
        payload: { errors: [{ message: "Unsupported exchange unit" }] },
      })
      return pubsub.createAsyncIterator({ trigger: immediateTrigger })
    }

    const pricePerSat = await Prices.getCurrentPrice({ currency: checkedDisplayCurrency })
    if (!(pricePerSat instanceof Error)) {
      const { timestamp, price } = pricePerSat
      pubsub.publishImmediate({
        trigger: immediateTrigger,
        payload: { timestamp, centsPerSat: 100 * price, displayCurrency },
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
