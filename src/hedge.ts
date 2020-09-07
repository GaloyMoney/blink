const lnService = require('ln-service')
const ccxt = require('ccxt')
import { find } from "lodash";
import { AdminWallet } from "./LightningAdminImpl";
import { Price } from "./priceImpl";
import { btc2sat, sleep } from "./utils";
const util = require('util')
const assert = require('assert')

const apiKey = process.env.FTX_KEY
const secret = process.env.FTX_SECRET

const LOW_BOUND = 0.8
const LOW_SAFEBOUND = 0.9
const HIGH_SAFEBOUND = 1.1
const HIGH_BOUND = 1.2

const symbol = 'BTC-PERP'


export class Hedging {
  adminWallet
  ftx

  constructor() {
    // FIXME: role: admin
    this.adminWallet = new AdminWallet()
    this.ftx = new ccxt.ftx({ apiKey, secret })
  }

  calculate({ equity, lastBTCPrice, netSizeSats }) {

    const absoluteExposureBTC = equity + netSizeSats
    const absoluteExposureUSD = lastBTCPrice * absoluteExposureBTC

    // this would move when equity change / payment being made/received
    // TODO: find a better name. Delta seems to be used mainly for options?
    const exposureRatio = (- netSizeSats) / equity

    let needHedging = false
    let amount, direction

    try {
      // undercovered (ie: have BTC not covered)
      // long
      // will loose money if BTCUSD price drops
      if (exposureRatio < LOW_BOUND) {
        const target = equity * LOW_SAFEBOUND
        amount = target + netSizeSats
        assert(amount > 0)
        assert(amount < equity)
        direction = "sell"
        needHedging = true
      }

      // overexposed
      // short
      // will loose money if BTCUSD price increase
      else if (exposureRatio > HIGH_BOUND) {
        const target = equity * HIGH_SAFEBOUND
        amount = - (target + netSizeSats)
        assert(amount > 0)
        assert(amount < equity)
        direction = "buy"
        needHedging = true
      }

    } catch (err) {
      throw Error("can't calculate hedging value")
    }

    return { needHedging, amount, direction }
  }

  async executeOrder({ direction, amount }) {

    // let orderId = 6103637365
    let orderId

    // TODO add: try/catch
    const order = await this.ftx.createOrder(symbol, 'market', direction, amount)

    // FIXME: have a better way to manage latency
    // ie: use a while loop and check condition for a couple of seconds.
    // or rely on a websocket
    await sleep(1000)

    const result = await this.ftx.fetchOrder(order.id)

    if (result.status !== "closed") {
      console.warn("market order has not been fullfilled")
      // Pager
    }

    // TODO: check we are back to low_safebound

  }

  async getPosition() {
    let { equity } = await this.adminWallet.getBalanceSheet()

    console.log({ equity })

    // FIXME maybe not the best way to do things
    equity = - equity

    const price = new Price()
    const lastBTCPrice = await price.lastPrice()

    // const ftx_balance = await ftx.fetchBalance()

    // const orders = await ftx.fetchOpenOrders()
    // const tradingFees = await ftx.fetchTradingFees()
    const { result } = await this.ftx.privateGetPositions()

    console.log(util.inspect({ result }, false, Infinity))

    // TODO: might return an error if there is no position yet
    const { netSize } = find(result, { future: 'BTC-PERP' })
    const netSizeSats = btc2sat(netSize)

    const { needHedging, amount, direction } = this.calculate({ equity, netSizeSats, lastBTCPrice })

    return { needHedging, amount, direction, equity, netSizeSats }
  }

  async updatePosition() {
    const { needHedging, amount, direction } = await this.getPosition()

    if (!needHedging) {
      return
    }

    await this.executeOrder({ amount, direction })
    // TODO: look at liquidation ratio
  }
}


// exports.quoteLNDBTC = functions.https.onCall(async (data: IQuoteRequest, context) => {
//     checkBankingEnabled(context)

//     const SPREAD = 0.015 //1.5%
//     const QUOTE_VALIDITY = {seconds: 30}

//     const constraints = {
//         // side is from the customer side.
//         // eg: buy side means customer is buying, we are selling.
//         side: {
//             inclusion: ["buy", "sell"]
//         },
//         invoice: function(value: any, attributes: any) {
//             if (attributes.side === "sell") return null;
//             return {
//               presence: {message: "is required for buy order"},
//               length: {minimum: 6} // what should be the minimum invoice length?
//             };
//         }, // we can derive satAmount for sell order with the invoice
//         satAmount: function(value: any, attributes: any) {
//             if (attributes.side === "buy") return null;
//             return {
//                 presence: {message: "is required for sell order"},
//                 numericality: {
//                     onlyInteger: true,
//                     greaterThan: 0
//             }}
//     }}

//     const err = validate(data, constraints)
//     if (err !== undefined) {
//         throw new functions.https.HttpsError('invalid-argument', JSON.stringify(err))
//     }

//     console.log(`${data.side} quote request from ${context.auth!.uid}, request: ${JSON.stringify(data, null, 4)}`)

//     let spot

//     try {
//         const price = new Price()
//         spot = await price.lastCached()
//     } catch (err) {
//         throw new functions.https.HttpsError('unavailable', err)
//     }

//     const satAmount = data.satAmount

//     let multiplier = NaN

//     if (data.side === "buy") {
//         multiplier = 1 + SPREAD
//     } else if (data.side === "sell") {
//         multiplier = 1 - SPREAD
//     }

//     const side = data.side
//     const satPrice = multiplier * spot
//     const validUntil = moment().add(QUOTE_VALIDITY)

    // const lnd = initLnd()

    // const description = {
    //     satPrice,
    //     memo: "Sell BTC"
    // }

    // if (data.side === "sell") {
    //     const {request} = await lnService.createInvoice(
    //         {lnd, 
    //         tokens: satAmount,
    //         description: JSON.stringify(description),
    //         expires_at: validUntil.toISOString(),
    //     });

    //     if (request === undefined) {
    //         throw new functions.https.HttpsError('unavailable', 'error creating invoice')
    //     }

    //     return {side, invoice: request} as IQuoteResponse

    // } else if (data.side === "buy") {

    //     const invoiceJson = await lnService.decodePaymentRequest({lnd, request: data.invoice})

    //     if (moment.utc() < moment.utc(invoiceJson.expires_at).subtract(QUOTE_VALIDITY)) { 
    //         throw new functions.https.HttpsError('failed-precondition', 'invoice expire within 30 seconds')
    //     }

    //     if (moment.utc() > moment.utc(invoiceJson.expires_at)) {
    //         throw new functions.https.HttpsError('failed-precondition', 'invoice already expired')
    //     }

    //     const message: IQuoteResponse = {
    //         side, 
    //         satPrice, 
    //         invoice: data.invoice!,
    //     }

    //     const signedMessage = await sign({... message})

    //     console.log(signedMessage)
    //     return signedMessage
    // }

    // return {'result': 'success'}
// })


// exports.buyLNDBTC = functions.https.onCall(async (data: IBuyRequest, context) => {
//     checkBankingEnabled(context)

//     const constraints = {
//         side: {
//             inclusion: ["buy"]
//         },
//         invoice: {
//             presence: true,
//             length: {minimum: 6} // what should be the minimum invoice length?
//         },
//         satPrice: {
//             presence: true,
//             numericality: {
//                 greaterThan: 0
//         }},
//         signature: {
//             presence: true,
//             length: {minimum: 6} // FIXME set correct signature length
//         }
//     }

//     const err = validate(data, constraints)
//     if (err !== undefined) {
//         throw new functions.https.HttpsError('invalid-argument', JSON.stringify(err))
//     }

//     if (!verify(data)) {
//         throw new functions.https.HttpsError('failed-precondition', 'signature is not valid')
//     }

    // const lnd = initLnd()
    // const invoiceJson = await lnService.decodePaymentRequest({lnd, request: data.invoice})

    // const satAmount = invoiceJson.tokens
    // const destination = invoiceJson.destination

    // const fiatAmount = satAmount * data.satPrice

    // if (await new FiatUserWallet({uid: context.auth!.uid}).getBalance() < fiatAmount) {
    //     throw new functions.https.HttpsError('permission-denied', 'not enough dollar to proceed')
    // }

    // const {route} = await lnService.probeForRoute({lnd, tokens: satAmount, destination})

    // if (route?.length === 0) {
    //     throw new functions.https.HttpsError('internal', `Can't probe payment. Not enough liquidity?`)
    // }

    // const request = {lnd, ...invoiceJson}
    // console.log({request})

    // try {
    //     await lnService.payViaPaymentDetails(request) // TODO move to pay to unified payment to our light client
    // } catch (err) {
    //     console.error(err)
    //     throw new functions.https.HttpsError('internal', `Error paying invoice ${err[0]}, ${err[1]}, ${err[2]?.details}`)
    // }

    // const fiat_tx: FiatTransaction = {
    //     amount: - fiatAmount, 
    //     date: moment().unix(),
    //     icon: "logo-bitcoin",
    //     name: "Bought Bitcoin",
    //     // onchain_tx: onchain_tx.id
    // }

    // try {
    //     // FIXME move to mongoose
    //     // const result = await firestore.doc(`/users/${context.auth!.uid}`).update({
    //     //     transactions: admin.firestore.FieldValue.arrayUnion(fiat_tx)
    //     // })

    //     // console.log(result)
    // } catch(err) {
    //     throw new functions.https.HttpsError('internal', 'issue updating transaction on the database')
    // }

    // console.log("success")
    // return {success: "success"}
// })