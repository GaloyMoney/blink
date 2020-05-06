import * as functions from 'firebase-functions'
import { sat2btc } from "./utils"
import { setupMongoose } from "./db"
const mongoose = require("mongoose")

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
        // let coinbase = new ccxt.coinbase()
        // let bitfinex = new ccxt.bitfinex()
        let ohlcv;
        try {
            ohlcv = await kraken.fetchOHLCV(this.pair, "1h");
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

    async lastCached() { //: Promise<number | Error> {
        const PriceHistory = await this.getPriceHistory()
        const ohlcv = await PriceHistory.findOne(this.path)
        const data = ohlcv.pair.exchange.price.slice(-25)
        return data
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

            for (const value of ohlcv) {
                doc.pair.exchange.price.addToSet({t: value[0], o: sat2btc(value[1])})
            }

            doc.save()
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
