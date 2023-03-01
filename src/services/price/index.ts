import util from "util"

import { credentials } from "@grpc/grpc-js"
import {
  PriceServiceError,
  UnknownPriceServiceError,
  PriceNotAvailableError,
  PriceCurrenciesNotAvailableError,
} from "@domain/price"

import { SATS_PER_BTC } from "@domain/bitcoin"

import { WalletCurrency } from "@domain/shared"

import { CENTS_PER_USD, DisplayCurrency } from "@domain/fiat"

import { baseLogger } from "../logger"

import { PriceHistoryProtoDescriptor, PriceProtoDescriptor } from "./grpc"

const priceUrl = process.env.PRICE_HOST ?? "galoy-price"
const pricePort = process.env.PRICE_PORT ?? "50051"
const fullUrl = `${priceUrl}:${pricePort}`
const priceClient = new PriceProtoDescriptor.PriceFeed(
  fullUrl,
  credentials.createInsecure(),
)
const getPrice = util.promisify(priceClient.getPrice).bind(priceClient)
const listPriceCurrencies = util.promisify(priceClient.listCurrencies).bind(priceClient)

const priceHistoryUrl = process.env.PRICE_HISTORY_HOST ?? "price-history"
const priceHistoryPort = process.env.PRICE_HISTORY_PORT ?? "50052"
const priceHistoryFullUrl = `${priceHistoryUrl}:${priceHistoryPort}`
const priceHistoryClient = new PriceHistoryProtoDescriptor.PriceHistory(
  priceHistoryFullUrl,
  credentials.createInsecure(),
)
const listPrices = util.promisify(priceHistoryClient.listPrices).bind(priceHistoryClient)

export const PriceService = (): IPriceService => {
  const getSatRealTimePrice = ({
    displayCurrency,
  }: GetSatRealTimePriceArgs): Promise<
    RealTimePrice<DisplayCurrency> | PriceServiceError
  > =>
    getRealTimePrice({
      displayCurrency,
      walletCurrency: WalletCurrency.Btc,
    })

  const getUsdCentRealTimePrice = ({
    displayCurrency,
  }: GetUsdCentRealTimePriceArgs): Promise<
    RealTimePrice<DisplayCurrency> | PriceServiceError
  > =>
    getRealTimePrice({
      displayCurrency,
      walletCurrency: WalletCurrency.Usd,
    })

  const getRealTimePrice = async ({
    displayCurrency,
    walletCurrency = WalletCurrency.Btc,
  }: GetRealTimePriceArgs): Promise<
    RealTimePrice<DisplayCurrency> | PriceServiceError
  > => {
    try {
      if (walletCurrency === displayCurrency) {
        const offset =
          displayCurrency === DisplayCurrency.Usd ? CENTS_PER_USD : SATS_PER_BTC
        return {
          timestamp: new Date(Date.now()),
          price: 1 / offset,
          currency: displayCurrency,
        }
      }

      // FIXME: price server should return CentsPerSat directly and timestamp
      const { price } = await getPrice({ currency: displayCurrency })
      if (!price) return new PriceNotAvailableError()

      let displayCurrencyPrice = price / SATS_PER_BTC
      if (walletCurrency === WalletCurrency.Usd) {
        const { price: usdBtcPrice } = await getPrice({ currency: DisplayCurrency.Usd })
        if (!usdBtcPrice) return new PriceNotAvailableError()

        displayCurrencyPrice = price / usdBtcPrice / CENTS_PER_USD
      }

      return {
        timestamp: new Date(Date.now()),
        price: displayCurrencyPrice,
        currency: displayCurrency,
      }
    } catch (err) {
      baseLogger.error({ err }, "impossible to fetch most recent price")
      return new UnknownPriceServiceError(err.message || err)
    }
  }

  const listHistory = async ({
    range,
  }: ListHistoryArgs): Promise<Tick[] | PriceServiceError> => {
    try {
      const { priceHistory } = await listPrices({ range })
      return priceHistory.map((t: { timestamp: number; price: number }) => ({
        date: new Date(t.timestamp * 1000),
        price: t.price / SATS_PER_BTC,
      }))
    } catch (err) {
      return new UnknownPriceServiceError(err.message || err)
    }
  }

  const listCurrencies = async (): Promise<PriceCurrency[] | PriceServiceError> => {
    try {
      const { currencies } = await listPriceCurrencies({})
      if (!currencies || currencies.length === 0)
        return new PriceCurrenciesNotAvailableError()

      return currencies.map(
        (c: {
          code: string
          symbol: string
          name: string
          flag: string
          fractionDigits: number
        }) =>
          ({
            code: c.code,
            symbol: c.symbol,
            name: c.name,
            flag: c.flag,
            fractionDigits: c.fractionDigits,
          } as PriceCurrency),
      )
    } catch (err) {
      return new UnknownPriceServiceError(err.message || err)
    }
  }

  return {
    getSatRealTimePrice,
    getUsdCentRealTimePrice,
    listHistory,
    listCurrencies,
  }
}
