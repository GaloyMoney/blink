import * as functions from 'firebase-functions'
import { sat2btc } from "./utils"
import { setupMongoose } from "./db"
const mongoose = require("mongoose")
import moment = require("moment")
const util = require('util')

export class Price {
    readonly pair
    readonly path

    constructor(pair = "BTC/USD") {
        this.pair = pair
        this.path = {
            "pair.name": this.pair,
            "pair.exchange.name": "kraken"
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
    async getFromExchange(): Promise<Array<object>> {
        const ccxt = require('ccxt');
        const kraken = new ccxt.kraken();
        // const coinbase = new ccxt.coinbase()
        // const bitfinex = new ccxt.bitfinex()
        let ohlcv;
        try {
            ohlcv = await kraken.fetchOHLCV(
                this.pair,
                "1h",
                new Date().valueOf() - 3600 * 25 * 1000, // since
                25); // limit
            // ohlcv = await coinbase.fetchOHLCV(this.pair, "1h");
            // ohlcv = await bitfinex.fetchOHLCV(this.pair, "1h"); // start in 2013
        }
        catch (e) {
            if (e instanceof ccxt.NetworkError) {
                throw new functions.https.HttpsError('resource-exhausted', `fetchTicker failed due to a network error: ${e.message}`);
            }
            else if (e instanceof ccxt.ExchangeError) {
                throw new functions.https.HttpsError('resource-exhausted', `fetchTicker failed due to exchange error: ${e.message}`);
            }
            else {
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
        })).sort((a, b) => a.t - b.t).slice(-25)
        return result
    }

    async update(): Promise<void> {
        const PriceHistory = await this.getPriceHistory()
        const ohlcv = await this.getFromExchange()

        const default_obj = {
            pair: {
                name: this.pair,
                exchange: {
                    name: "kraken"
        }}}

        const options = { upsert: true, new: true }

        try {
            const doc = await PriceHistory.findOneAndUpdate(this.path, {}, options)

            console.log(util.inspect({doc}, {showHidden: false, depth: null}))

            for (const value of ohlcv) {
                // FIXME inefficient
                if(doc.pair.exchange.price.find(obj => obj._id.getTime() === value[0])) {
                    continue
                }

                doc.pair.exchange.price.push({_id: value[0], o: sat2btc(value[1])})
            }

            await doc.save()
        }
        catch (err) {
            throw new functions.https.HttpsError('internal', 'cannot save to db: ' + err.toString())
        }
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
