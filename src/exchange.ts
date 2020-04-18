import * as functions from 'firebase-functions'
// import { CurrencyType } from "../../../../common/types"
import { initLnd } from "./lightning"
import { getFiatBalance } from "./fiat";
import { checkBankingEnabled, btc2sat, validate } from "./utils";

const {getChainBalance} = require('ln-service')
const {getChannelBalance} = require('ln-service');
const lnService = require('ln-service')
import {priceBTC} from "./price"
import { verify, sign } from "./crypto";
import moment = require("moment")
import { FiatTransaction } from "./interface"
import * as admin from 'firebase-admin'
import { IBuyRequest, IQuoteResponse, IQuoteRequest } from "../../../../common/types";
const firestore = admin.firestore()

const ccxt = require ('ccxt');


// unsecured //
const apiKey = "***REMOVED***"
const secret = "***REMOVED***"


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


exports.quoteLNDBTC = functions.https.onCall(async (data: IQuoteRequest, context) => {
    checkBankingEnabled(context)

    const SPREAD = 0.015 //1.5%
    const QUOTE_VALIDITY = {seconds: 30}

    const constraints = {
        // side is from the customer side.
        // eg: buy side means customer is buying, we are selling.
        side: {
            inclusion: ["buy", "sell"]
        },
        invoice: function(value: any, attributes: any) {
            if (attributes.side === "sell") return null;
            return {
              presence: {message: "is required for buy order"},
              length: {minimum: 6} // what should be the minimum invoice length?
            };
        }, // we can derive satAmount for sell order with the invoice
        satAmount: function(value: any, attributes: any) {
            if (attributes.side === "buy") return null;
            return {
                presence: {message: "is required for sell order"},
                numericality: {
                    onlyInteger: true,
                    greaterThan: 0
            }}
    }}

    const err = validate(data, constraints)
    if (err !== undefined) {
        throw new functions.https.HttpsError('invalid-argument', JSON.stringify(err))
    }
    
    console.log(`${data.side} quote request from ${context.auth!.uid}, request: ${JSON.stringify(data, null, 4)}`)

    let spot
    
    try {
        spot = await priceBTC()
    } catch (err) {
        throw new functions.https.HttpsError('unavailable', err)
    }

    const satAmount = data.satAmount

    let multiplier = NaN

    if (data.side === "buy") {
        multiplier = 1 + SPREAD
    } else if (data.side === "sell") {
        multiplier = 1 - SPREAD
    }

    const side = data.side
    const satPrice = multiplier * spot
    const validUntil = moment().add(QUOTE_VALIDITY)

    const lnd = initLnd()

    const description = {
        satPrice,
        memo: "Sell BTC"
    }

    if (data.side === "sell") {
        const {request} = await lnService.createInvoice(
            {lnd, 
            tokens: satAmount,
            description: JSON.stringify(description),
            expires_at: validUntil.toISOString(),
        });

        if (request === undefined) {
            throw new functions.https.HttpsError('unavailable', 'error creating invoice')
        }

        return {side, invoice: request} as IQuoteResponse
        
    } else if (data.side === "buy") {

        const invoiceJson = await lnService.decodePaymentRequest({lnd, request: data.invoice})

        if (moment.utc() < moment.utc(invoiceJson.expires_at).subtract(QUOTE_VALIDITY)) { 
            throw new functions.https.HttpsError('failed-precondition', 'invoice expire within 30 seconds')
        }

        if (moment.utc() > moment.utc(invoiceJson.expires_at)) {
            throw new functions.https.HttpsError('failed-precondition', 'invoice already expired')
        }

        const message: IQuoteResponse = {
            side, 
            satPrice, 
            invoice: data.invoice!,
        }

        const signedMessage = await sign({... message})

        console.log(signedMessage)
        return signedMessage
    }

    return {'result': 'success'}
})


exports.buyLNDBTC = functions.https.onCall(async (data: IBuyRequest, context) => {
    checkBankingEnabled(context)

    const constraints = {
        side: {
            inclusion: ["buy"]
        },
        invoice: {
            presence: true,
            length: {minimum: 6} // what should be the minimum invoice length?
        },
        satPrice: {
            presence: true,
            numericality: {
                greaterThan: 0
        }},
        signature: {
            presence: true,
            length: {minimum: 6} // FIXME set correct signature length
        }
    }

    const err = validate(data, constraints)
    if (err !== undefined) {
        throw new functions.https.HttpsError('invalid-argument', JSON.stringify(err))
    }

    if (!verify(data)) {
        throw new functions.https.HttpsError('failed-precondition', 'signature is not valid')
    }

    const lnd = initLnd()
    const invoiceJson = await lnService.decodePaymentRequest({lnd, request: data.invoice})

    const satAmount = invoiceJson.tokens
    const destination = invoiceJson.destination

    const fiatAmount = satAmount * data.satPrice

    if (await getFiatBalance(context.auth!.uid) < fiatAmount) {
        throw new functions.https.HttpsError('permission-denied', 'not enough dollar to proceed')
    }

    const {route} = await lnService.probeForRoute({lnd, tokens: satAmount, destination})
    
    if (route?.length === 0) {
        throw new functions.https.HttpsError('internal', `Can't probe payment. Not enough liquidity?`)
    }

    const request = {lnd, ...invoiceJson}
    console.log({request})

    try {
        await lnService.payViaPaymentDetails(request) // TODO move to pay to unified payment to our light client
    } catch (err) {
        console.error(err)
        throw new functions.https.HttpsError('internal', `Error paying invoice ${err[0]}, ${err[1]}, ${err[2]?.details}`)
    }

    const fiat_tx: FiatTransaction = {
        amount: - fiatAmount, 
        date: moment().unix(),
        icon: "logo-bitcoin",
        name: "Bought Bitcoin",
        // onchain_tx: onchain_tx.id
    }

    try {
        const result = await firestore.doc(`/users/${context.auth!.uid}`).update({
            transactions: admin.firestore.FieldValue.arrayUnion(fiat_tx)
        })

        console.log(result)
    } catch(err) {
        throw new functions.https.HttpsError('internal', 'issue updating transaction on the database')
    }

    console.log("success")
    return {success: "success"}
})

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

