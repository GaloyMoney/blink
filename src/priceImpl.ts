import * as functions from 'firebase-functions'
import { sat2btc } from "./utils"
import { setupMongoose } from "./db"
const mongoose = require("mongoose")

export class Price {
    readonly currency
    protected PriceHistoryModel

    constructor(currency = "BTC/USD") {
        this.currency = currency;
    }

    protected async initDb() {
        await setupMongoose()

        this.PriceHistoryModel = mongoose.model("PriceHistory")
    }

    /**
     * favor lastCached
     * only used for unit test
     */
    async getFromExchange(): Promise<number | Error> {
        const ccxt = require('ccxt');
        const kraken = new ccxt.kraken();
        // let coinbase = new ccxt.coinbase()
        // let bitfinex = new ccxt.bitfinex()
        let ticker;
        try {
            ticker = await kraken.fetchTicker(this.currency);
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
        try {
            const satPrice = sat2btc((ticker.ask + ticker.bid) / 2);
            return satPrice;
        }
        catch {
            throw new functions.https.HttpsError('internal', "bad response from ref price server");
        }
    }

    async lastCached(): Promise<number | Error> {
        await this.initDb()
        const {price} = await this.PriceHistoryModel.findOne({}).sort({ created_at: -1 })
        return price
    }

    async update(): Promise<void> {
        await this.initDb()

        const price = await this.getFromExchange();
        const priceDb = new this.PriceHistoryModel({ price: price });
        try {
            await priceDb.save();
        }
        catch (err) {
            throw new functions.https.HttpsError('internal', 'cannot save to db: ' + err.toString());
        }
    }
}
