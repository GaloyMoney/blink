import * as functions from 'firebase-functions'
// import { CurrencyType } from "../../../../common/types"
import { initLnd } from "./lightning"

const {getChainBalance} = require('ln-service')
const {getChannelBalance} = require('ln-service');

const ccxt = require ('ccxt');

// unsecured //
const apiKey = "***REMOVED***"
const secret = "***REMOVED***"

export const btc2sat = (btc: number) => {
    return btc * Math.pow(10, 8)
}

export const sat2btc = (btc: number) => {
    return btc / Math.pow(10, 8)
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

type Balance = {
    BTC: {
        total: number,
        exchange: number,
        onchain: number,
        offchain: number,
    },
    USD: {
       total: number,
       exchange: number,
    },
}

export const getBalance = async (): Promise<Balance> => {
    
    const balance: Balance = {
        BTC: {
            total: 0,
            exchange: 0,
            onchain: 0,
            offchain: 0,
        },
        USD: {
            total: 0,
            exchange: 0,
    }}

    const kraken = new ccxt.kraken({ apiKey, secret })

    const balanceKraken = await kraken.fetchBalance()
    console.log({balanceKraken})
    balance.BTC.exchange = btc2sat(balanceKraken.BTC.total) // TODO manage free and used
    balance.USD.exchange = balanceKraken.USD.total 

    const lnd = initLnd()

    try {
        const chainBalance = (await getChainBalance({lnd})).chain_balance;
        console.log({chainBalance})
        balance.BTC.onchain = chainBalance
    } catch(err) {
        console.log(`error getting chainBalance ${err}`)
    }

    try {
        const balanceInChannels = (await getChannelBalance({lnd})).channel_balance;
        console.log({balanceInChannels})
        balance.BTC.offchain = balanceInChannels
    } catch(err) {
        console.error(`error getting balanceInChannels ${err}`)
    }

    balance.BTC.total = Object.values(balance.BTC).reduce((acc, value) => acc + value, 0)
    balance.USD.total = Object.values(balance.USD).reduce((acc, value) => acc + value, 0)

    console.log({balance})
    return balance
}

export const withdrawExchange = () => {

    // const address = lnd.

    const kraken = new ccxt.kraken({ apiKey, secret })

    const key = 'lnd' // key has to be set from the user interface  
    const code = 'BTC'
    const amount = 0.01

     // not sure if this have to match key? I guess it should
    const address = 'bc1qs08semyyerehc0604typuvg777lygep4lkjuya'
    kraken.withdraw (code, amount, address, undefined, {key})
}

/**
 * very, very crude "hedging", probably not the right word
 * look at future contract for better hedging
 * untested
 */
export const hedging = async () => {

    const kraken = new ccxt.kraken({ apiKey, secret })

    const minWalletBTC = 1 // TODO --> find right number
    const maxWalletBTC = 2 // TODO
    const midWalletBTC = (minWalletBTC + maxWalletBTC) / 2

    const balance = await getBalance()

    const symbol = "BTC/USD"

    if (balance.USD.total > maxWalletBTC) {
        const amount = balance.USD.total - maxWalletBTC - midWalletBTC
        let result = kraken.createMarketSellOrder(symbol, amount)
        console.log({result})
    } else if (balance.USD.total < minWalletBTC) {
        const amount = minWalletBTC - balance.USD.total + midWalletBTC
        let result = kraken.createMarketBuyOrder(symbol, amount)
        console.log({result})
    }
}

// TODO: move money from / to exchange / wallet

