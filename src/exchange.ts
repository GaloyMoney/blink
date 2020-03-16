import * as functions from 'firebase-functions'
const ccxt = require ('ccxt');


/**
 * @returns      Price of BTC in sat.
 */
export const priceBTC = async (): Promise<number> => {

    let kraken = new ccxt.kraken()
    // let coinbase = new ccxt.coinbase()
    // let bitfinex = new ccxt.bitfinex()
    
    let ticker

    try {
        ticker = await kraken.fetchTicker('BTC/USD')
    } catch (e) {
        // if the exception is thrown, it is "caught" and can be handled here
        // the handling reaction depends on the type of the exception
        // and on the purpose or business logic of your application
        if (e instanceof ccxt.NetworkError) {
            console.log ('fetchTicker failed due to a network error:', e.message)
            // retry or whatever
            // ...
        } else if (e instanceof ccxt.ExchangeError) {
            console.log ('fetchTicker failed due to exchange error:', e.message)
            // retry or whatever
            // ...
        } else {
            console.log ('fetchTicker failed with:', e.message)
            // retry or whatever
            // ...
        }
        throw new functions.https.HttpsError('resource-exhausted', "issue with ref exchanges")
    }

    try {
        const sat_price = (ticker.ask + ticker.bid) / 2 * Math.pow(10, -8)
        console.log(`sat spot price is ${sat_price}`)
        return sat_price
    } catch {
        throw new functions.https.HttpsError('internal', "bad response from ref price server")
    }
}

