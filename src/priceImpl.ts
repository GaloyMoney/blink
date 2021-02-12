import { dropRight, last } from "lodash"
import { PriceHistory } from "./mongodb"
import { sat2btc } from "./utils"
import moment = require("moment")


interface ITick {
  id: number // timestamp
  o: number // opening price
}


export class Price {
  readonly pair
  readonly path
  readonly ccxt
  readonly exchange_string
  readonly exchange
  readonly logger: any

  constructor({logger}) {
    this.exchange_string = "bitfinex"

    const ccxt = require('ccxt');
    this.exchange = new ccxt[this.exchange_string]({
      'enableRateLimit': true,
      'rateLimit': 2500,
      'timeout': 5000,
    })

    this.ccxt = ccxt

    this.pair = "BTC/USD"
    this.path = {
      "pair.name": this.pair,
      "pair.exchange.name": this.exchange_string
    }
    this.logger = logger
  }

  /**
   * favor lastCached
   * only used for unit test
   */
  async getFromExchange({ since, limit, init }:
    { since: number, limit: number, init: Boolean }): Promise<Array<object>> {

    this.logger.info("start fetching data from exchange")
    let ohlcv;
    try {
      ohlcv = await this.exchange.fetchOHLCV(this.pair, "1h", since, limit);
      this.logger.info("data fetched from exchange")
    }
    catch (e) {
      if (e instanceof this.ccxt.NetworkError) {
        throw new Error(`fetchTicker failed due to a network error: ${e.message}`);
      } else if (e instanceof this.ccxt.ExchangeError) {
        throw new Error(`fetchTicker failed due to exchange error: ${e.message}`);
      } else {
        throw new Error(`issue with ref exchanges: ${e}`);
      }
    }

    return ohlcv
  }

  async lastCached(): Promise<Array<ITick>> {
    const ohlcv = await PriceHistory.findOne(this.path)
    // TODO use sort + only request the last 25 data points at the db level for optimization
    // assuming we can do this on subquery in MongoDB
    const data = ohlcv.pair.exchange.price
    const result = data.map(value => ({
      id: moment(value._id).unix(),
      o: value.o
    })).sort((a, b) => a.t - b.t).slice(- (24 * 366 + 1)) // 1y of hourly candles / FIXME use date instead.

    const DEBUG = false
    if (DEBUG) {
      const fs = require('fs');
      fs.writeFile("test.txt", JSON.stringify(result, null, 4), (err) => {
        if (err) {
          this.logger.error({ err }, "error writing test file (useless log?)")
        }
      })
    }

    return result
  }

  async lastPrice(): Promise<number> {
    const lastCached = await this.lastCached()
    return (last(lastCached) as ITick).o
  }

  async eraseIfLastIsNotHourlyCandle({doc}) {
    if (!doc.pair.exchange.price.length) {
      this.logger.debug("empty price array")
      return
    }

    // @ts-ignore
    const lastEntryDate = moment(last(doc.pair.exchange.price)._id)

    const isHourlyCandle = lastEntryDate.minutes() === 0 && 
      lastEntryDate.seconds() === 0 && 
      lastEntryDate.milliseconds() === 0
    
    if (!isHourlyCandle) {
      doc.pair.exchange.price = dropRight(doc.pair.exchange.price)
    }

    await doc.save()
  }

  async fastUpdate() {
    let lastPrice, datetime, doc

    try {
      doc = await PriceHistory.findOne(this.path)
    } catch (err) {
      this.logger.error({err}, "can't fetch price history from mongodb")
      return
    }

    try {
      ({ last: lastPrice, datetime } = await this.exchange.fetchTicker(this.pair))
    } catch (err) {
      this.logger.error({err}, "can't fetch ticker")
      return
    }

    try {
      await this.eraseIfLastIsNotHourlyCandle({doc})

      this.logger.info({lastPrice, datetime}, "updating price")
  
      doc.pair.exchange.price.push({ _id: datetime, o: sat2btc(lastPrice) })
      await doc.save()
    } catch (err) {
      this.logger.error({err}, "can't update the price on mongodb")
      return
    }
  }


  async update(init = false): Promise<Boolean | Error> {
    const increment = 720 // how many candles
    const increment_ms = increment * 3600 * 1000
    const endDate = new Date().valueOf() - 3600 * 1000

    const startDate = init ?
      new Date().valueOf() - 1000 * 3600 * 24 * 366
      : new Date().valueOf() - 1000 * 3600 * 25

    const limit = init ? increment : 25

    let currDate = startDate

    let doc = await PriceHistory.findOne(this.path)

    if (doc === null) {
      doc = new PriceHistory({
        pair: {
          name: "BTC/USD",
          exchange: {
            name: this.exchange_string
          }
        }
      })
    }

    await this.eraseIfLastIsNotHourlyCandle({doc})

    // skip if it has not been an hour since last update
    try {
      // @ts-ignore
      const diff = moment().diff(moment(last(doc.pair.exchange.price)._id))
      if (diff < 1000 * 60 * 60) {
        return false
      }
    } catch (err) {
      this.logger.info({err}, "can't detect last price")
    }

    while (currDate < endDate) {
      this.logger.debug({ currDate, endDate }, "loop to fetch data from exchange")
      const ohlcv = await this.getFromExchange({ since: currDate, limit, init })

      console.log({ohlcv})

      try {

        for (const value of ohlcv) {

          // FIXME inefficient
          if (doc.pair.exchange.price.find(obj => obj._id.getTime() === value[0])) {
            // this.logger.debug({value0: value[0]}, "we already have those price datas in our database")
            continue
          }
          
          
          this.logger.debug({value0: value[0]}, "adding entry to our price database")
          doc.pair.exchange.price.push({ _id: value[0], o: sat2btc(value[1]) })

          console.log({price: doc.pair.exchange.price})
        }

        await doc.save()
      }
      catch (err) {
        throw new Error('cannot save to db: ' + err.toString())
      }

      currDate += increment_ms
    }

    return true
  }

  // async updateSpot(): Promise<void> {
  //     await this.initDb()

  //     const price = await this.getFromExchange();
  //     const priceDb = new this.PriceHistoryModel({ price }); // FIXME
  //     try {
  //         await priceDb.save();
  //     }
  //     catch (err) {
  //         throw new functions.https.HttpsError('internal', 'cannot save to db: ' + err.toString());
  //     }
  // }
}
