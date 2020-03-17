import * as functions from 'firebase-functions'
// import { CurrencyType } from "../../../../common/types"
import { initLnd } from "./lightning"

const {getChainBalance} = require('ln-service')
const {getChannelBalance} = require('ln-service');

const ccxt = require ('ccxt');

const apiKey = "***REMOVED***"
const secret = "***REMOVED***"

export const btc2sat = (btc: number) => {
    return btc * Math.pow(10, 8)
}

/**
 * @returns      Price of BTC in sat.
 */
export const priceBTC = async (): Promise<number> => {

    const kraken = new ccxt.kraken()
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
        const satPrice = btc2sat((ticker.ask + ticker.bid) / 2)
        console.log(`sat spot price is ${satPrice}`)
        return satPrice
    } catch {
        throw new functions.https.HttpsError('internal', "bad response from ref price server")
    }
}

export const getBalance = async (): Promise<Object> => {
    const balance = {
        USD: 0,
        BTC: 0,
    }

    const kraken = new ccxt.kraken({
        apiKey,
        secret,
    })

    const balanceKraken = await kraken.fetchBalance()
    console.log({balanceKraken})
    balance.BTC += btc2sat(balanceKraken.BTC.total) // TODO manage free and used
    balance.USD += balanceKraken.USD.total 

    console.log({balance})


    const lnd = initLnd()

    try {
        const chainBalance = (await getChainBalance({lnd})).chain_balance;
        console.log({chainBalance})
        balance.BTC += chainBalance
    } catch(err) {
        console.log(`error getting chainBalance ${err}`)
    }

    try {
        const balanceInChannels = (await getChannelBalance({lnd})).channel_balance;
        console.log({balanceInChannels})
        balance.BTC += balanceInChannels
    } catch(err) {
        console.error(`error getting balanceInChannels ${err}`)
    }

    return balance
}