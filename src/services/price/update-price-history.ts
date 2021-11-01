import _ from "lodash"
import ccxt from "ccxt"
import moment from "moment"
import { baseLogger } from "@services/logger"
import { PriceHistory } from "./schema"

const pair = "BTC/USD"
const exchange = "bitfinex"

export const updatePriceHistory = async (init = false): Promise<boolean | Error> => {
  const increment = 720 // how many candles
  const increment_ms = increment * 3600 * 1000
  const endDate = new Date().valueOf() - 3600 * 1000

  const startDate = init
    ? new Date().valueOf() - 1000 * 3600 * 24 * 366
    : new Date().valueOf() - 1000 * 3600 * 25

  const limit = init ? increment : 25

  let currDate = startDate

  let doc = await PriceHistory.findOne({
    "pair.name": pair,
    "pair.exchange.name": exchange,
  })

  if (doc === null) {
    doc = new PriceHistory({
      pair: {
        name: pair,
        exchange: {
          name: exchange,
        },
      },
    })
  }

  // skip if it has not been an hour since last update
  try {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore-error: TODO
    const diff = moment().diff(moment(_.last(doc.pair.exchange.price)._id))
    if (diff < 1000 * 60 * 60) {
      return false
    }
  } catch (err) {
    baseLogger.info({ err }, "can't detect last price")
  }

  while (currDate < endDate) {
    baseLogger.debug({ currDate, endDate }, "loop to fetch data from exchange")
    const ohlcv = await getFromExchange({ since: currDate, limit, init })

    try {
      for (const value of ohlcv) {
        // FIXME inefficient
        if (doc.pair.exchange.price.find((obj) => obj._id.getTime() === value[0])) {
          continue
        }

        baseLogger.debug({ value0: value[0] }, "adding entry to our price database")
        doc.pair.exchange.price.push({ _id: value[0], o: value[1] / Math.pow(10, 8) })
      }

      await doc.save()
    } catch (err) {
      throw new Error("cannot save to db: " + err.toString())
    }

    currDate += increment_ms
  }

  return true
}

const getFromExchange = async ({
  since,
  limit,
}: {
  since: number
  limit: number
  init: boolean
}): Promise<ccxt.OHLCV[]> => {
  baseLogger.info("start fetching data from exchange")
  const client = new ccxt[exchange]({
    enableRateLimit: true,
    rateLimit: 2500,
    timeout: 5000,
  })

  try {
    const ohlcv = await client.fetchOHLCV(pair, "1h", since, limit)
    baseLogger.info("data fetched from exchange")
    return ohlcv
  } catch (e) {
    if (e instanceof ccxt.NetworkError) {
      throw new Error(`fetchTicker failed due to a network error: ${e.message}`)
    }

    if (e instanceof ccxt.ExchangeError) {
      throw new Error(`fetchTicker failed due to exchange error: ${e.message}`)
    }

    throw new Error(`issue with ref exchanges: ${e}`)
  }
}
