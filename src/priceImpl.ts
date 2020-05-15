import * as functions from 'firebase-functions'
import { sat2btc } from "./utils"
import { setupMongoose } from "./db"
const mongoose = require("mongoose")
import moment = require("moment")
const util = require('util')

export class Price {
    readonly pair
    readonly path
    readonly exchange

    constructor(pair = "BTC/USD") {
        this.pair = pair
        this.exchange = "bitfinex"
        this.path = {
            "pair.name": this.pair,
            "pair.exchange.name": this.exchange
        }
    }

    protected async getPriceHistory() {
        await setupMongoose()
        return mongoose.model("PriceHistory")
    }

    /**
     * favor lastCached
     * only used for unit test
     */
    async getFromExchange({since, limit, init}: 
        {since: number, limit: number, init: Boolean}): Promise<Array<object>> {
        const ccxt = require('ccxt');
        const exchange = new ccxt[this.exchange]({
            'enableRateLimit': init,
            'rateLimit': 30000,
            'timeout': 5000,
        })
        console.log("start")
        let ohlcv;
        try {
            ohlcv = await exchange.fetchOHLCV(this.pair, "1h", since, limit); 
            console.log("complete")
        }
        catch (e) {
            if (e instanceof ccxt.NetworkError) {
                throw new functions.https.HttpsError('resource-exhausted', `fetchTicker failed due to a network error: ${e.message}`);
            } else if (e instanceof ccxt.ExchangeError) {
                throw new functions.https.HttpsError('resource-exhausted', `fetchTicker failed due to exchange error: ${e.message}`);
            } else {
                throw new functions.https.HttpsError('internal', `issue with ref exchanges: ${e}`);
            }
        }

        return ohlcv
    }

    async lastCached(): Promise<Array<Object>> {
        const PriceHistory = await this.getPriceHistory()
        const ohlcv = await PriceHistory.findOne(this.path)
        // TODO use sort + only request the last 25 data points at the db level for optimization
        // assuming we can do this on subquery in MongoDB
        const data = ohlcv.pair.exchange.price
        const result = data.map(value => ({
            t: moment(value._id).unix(),
            o: value.o
        })).sort((a, b) => a.t - b.t).slice(- (24 * 366 + 1)) // 1y of hourly candles / FIXME use date instead.

        const DEBUG = false
        if (DEBUG) {
            var fs = require('fs');
            fs.writeFile("test.txt", JSON.stringify(result, null, 4), function(err) {
                if (err) {
                    console.log(err);
                }
        })}

        return result
    }

    async update(init = false): Promise<Boolean | Error> {
        const PriceHistory = await this.getPriceHistory()

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
                        name: this.exchange
                    }
                }
            })
        }

        while (currDate < endDate) {
            console.log({currDate, endDate})
            const ohlcv = await this.getFromExchange({since: currDate, limit, init})

            try {
    
                for (const value of ohlcv) {

                    // FIXME inefficient
                    if(doc.pair.exchange.price.find(obj => obj._id.getTime() === value[0])) {
                        console.log("continue")
                        continue
                    }
    
                    doc.pair.exchange.price.push({_id: value[0], o: sat2btc(value[1])})
                }
    
                await doc.save()
            }
            catch (err) {
                throw new functions.https.HttpsError('internal', 'cannot save to db: ' + err.toString())
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
