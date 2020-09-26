import { find } from "lodash";
import { LightningMixin } from "./Lightning";
import { MainBook } from "./mongodb";
import { OnChainMixin } from "./OnChain";
import { Price } from "./priceImpl";
import { ILightningWalletUser } from "./types";
import { btc2sat, sat2btc, sleep } from "./utils";
import { brokerAccountPath } from "./wallet";
const using = require('bluebird').using
const util = require('util')
const ccxt = require('ccxt')
const assert = require('assert')

const apiKey = process.env.FTX_KEY
const secret = process.env.FTX_SECRET

const LOW_BOUND_EXPOSURE = 0.8
const LOW_SAFEBOUND_EXPOSURE = 0.9
const HIGH_SAFEBOUND_EXPOSURE = 1.1
const HIGH_BOUND_EXPOSURE = 1.2

const LOW_BOUND_LEVERAGE = 0.75
const LOW_SAFEBOUND_LEVERAGE = 1
const HIGH_SAFEBOUND_LEVERAGE = 1.5
const HIGH_BOUND_LEVERAGE = 2

const symbol = 'BTC-PERP'


export class BrokerWallet {
  readonly uid: string
  readonly currency: string

  constructor({uid, currency}) {
    this.uid = uid
    this.currency = currency
  }

  get accountPath(): string {
    return brokerAccountPath
  }

  async getBalance() {

    const { balance } = await MainBook.balance({
      account: this.accountPath,
      currency: this.currency, 
    })

    return - balance
  }
}


export class LightningBrokerWallet extends OnChainMixin(BrokerWallet) {
  readonly currency = "BTC" 
  ftx
  price

  constructor({ uid }: ILightningWalletUser) {
    super({ uid, currency: "BTC" })
    this.ftx = new ccxt.ftx({ apiKey, secret })
    this.price = new Price()
  }

  async getLocalLiabilities() { 
    const { balance: usd } = await MainBook.balance({
      account: this.accountPath,
      currency: "USD", 
    })

    const { balance: sats } = await MainBook.balance({
      account: this.accountPath,
      currency: "BTC", 
    })

    return { 
      usd,
      sats
    }
  }

  async has() {
    return this.ftx.has
  }

  async createDepositAddress() {
    // create a new address
    // is not enabled on FTX
    // return this.ftx.createDepositAddress("BTC")
    return Error('not implemented')
  }

  async exchangeDepositAddress() {
    // same address is returned each time
    const { address } = await this.ftx.fetchDepositAddress("BTC")
    return address
  }

  async satsBalance() {
    const { sats: nodeLiabilities } = await this.getLocalLiabilities();
    const node = - nodeLiabilities

    // at least on FTX. interest will be charged when below -$30,000.
    // TODO: manage this part

    const {BTC: exchangeBTC} = await this.getExchangeBalance()
    const exchange = btc2sat(exchangeBTC)

    const total = node + exchange

    return {
      total,
      node,
      exchange
    }
  }

  async getExchangeBalance() {
    const balance = await this.ftx.fetchBalance()

    // TODO do not return only balance?
    return balance.total
    
  }

  async getFuturePosition() {
    const satsPrice = await this.price.lastPrice()
    // FIXME this helper function is inverse?
    // or because price = usd/btc, usd/sats, sat or btc are in the denominator
    // and therefore the "inverse" make sense...?
    const btcPrice = btc2sat(satsPrice) 

    // TODO: what is being returned if no order had been placed?
    // probably an empty array

    const { result: position } = await this.ftx.privateGetAccount()
    console.log({position})

    const positionBtcPerp = find(position, { future: symbol} )
    console.log({positionBtcPerp})

    const { netSize, estimatedLiquidationPrice, collateralUsed, maintenanceMarginRequirement } = positionBtcPerp

    assert(netSize <= 0)

    return {
      // making netSize positive to simplify calculation
      // we should always be short so netSize should initially 
      // always be negative
      btc: - netSize,

      // btc2sats because BTC is in the denominator... this is confusing.
      usd: - netSize * btcPrice,
      estimatedLiquidationPrice,
      collateralUsed, // USD
      maintenanceMarginRequirement, // start at 0.03 but increase with position side 
    }
  }

  async getExposureRatio() {
    const {usd: usdLiability} = await this.getLocalLiabilities()
    const {usd: usdExposure} = await this.getFuturePosition()

    return {
      ratio: usdLiability / usdExposure,
      diff: usdLiability - usdExposure
    }
  }

  async getLeverage() {
    const satsPrice = await this.price.lastPrice()
    const btcPrice = btc2sat(satsPrice) 

    const { usd: positionSize } = await this.getFuturePosition()
    const { BTC: btcCollateral } = await this.getExchangeBalance()
    const usdCollateral = btcCollateral * btcPrice
    const leverage = positionSize / usdCollateral

    console.log({usdCollateral, positionSize, leverage})
    // TODO the calculatation show a result with a few % variation FTX UI
    // should not be a problem given the low leverage but still need to be investigated
    return leverage
  }

  // we need to rebalance when price is increasing/decreasing.
  // if price increase, then the short position risk being liquidated
  // so we need to sned btc from the node to the exchange
  // if price decrease, then there would be too much btc on the exchange
  // the account won't be at the irsk of being liquidated in this case
  // but then the custody risk of the exchange increases
  isRebalanceNeeded({leverage, usdCollateral}) {

    let needRebalance = false
    let usdOrderAmount, direction, btcOrderAmount

    try {
      // undercovered (ie: have BTC not covered)
      // long
      // will loose money if BTCUSD price drops
      if (leverage < LOW_BOUND_EXPOSURE) {
        const targetCollateral = usdCollateral * LOW_SAFEBOUND_EXPOSURE
        usdOrderAmount = targetLeverage + usdExposure
        btcOrderAmount = sat2btc(usdOrderAmount * satsPrice)
        assert(btcOrderAmount > 0)
        // assert(btcOrderAmount < usdLiability)
        direction = "withdraw"
        needRebalance = true
      }

      // overexposed
      // short
      // will loose money if BTCUSD price increase
      else if (leverage > HIGH_BOUND_EXPOSURE) {
        const targetLeverage = usdLiability * HIGH_SAFEBOUND_EXPOSURE
        usdOrderAmount = - (targetLeverage + usdExposure)
        btcOrderAmount = usdOrderAmount
        assert(btcOrderAmount > 0)
        // assert(usdOrderAmount < usdLiability)

        direction = "deposit"
        needRebalance = true
      }

    } catch (err) {
      throw Error("can't calculate rebalance")
    }

    return { needRebalance, amount: btcOrderAmount, direction }

  }

  // we need to have an order when USD balance of the broker changes.
  // ie: when someone has sent/receive sats from their account
  isOrderNeeded({ ratio, usdLiability, usdExposure, satsPrice }) {

    let needOrder = false
    let usdOrderAmount, direction, btcOrderAmount

    try {
      // undercovered (ie: have BTC not covered)
      // long
      // will loose money if BTCUSD price drops
      if (ratio < LOW_BOUND_EXPOSURE) {
        const targetUsd = usdLiability * LOW_SAFEBOUND_EXPOSURE
        usdOrderAmount = targetUsd + usdExposure
        btcOrderAmount = sat2btc(usdOrderAmount * satsPrice)
        assert(btcOrderAmount > 0)
        // assert(btcOrderAmount < usdLiability)
        direction = "sell"
        needOrder = true
      }

      // overexposed
      // short
      // will loose money if BTCUSD price increase
      else if (ratio > HIGH_BOUND_EXPOSURE) {
        const targetUsd = usdLiability * HIGH_SAFEBOUND_EXPOSURE
        usdOrderAmount = - (targetUsd + usdExposure)
        btcOrderAmount = usdOrderAmount
        assert(btcOrderAmount > 0)
        // assert(usdOrderAmount < usdLiability)
        // TODO: should be reduce only
        direction = "buy"
        needOrder = true
      }

    } catch (err) {
      throw Error("can't calculate hedging value")
    }

    return { needOrder, amount: btcOrderAmount, direction }
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

  // TODO: cron job on this
  async updatePositionAndLeverage() {
    const satsPrice = await this.price.lastPrice()

    const {usd: usdLiability} = await this.getLocalLiabilities()
    const {usd: usdExposure} = await this.getFuturePosition()
    const {ratio} = await this.getExposureRatio()

    const { needOrder, amount, direction } = this.isOrderNeeded({ ratio, usdLiability, usdExposure, satsPrice })

    if (needOrder) {
      await this.executeOrder({ amount, direction })
    }

    const leverage = await this.getLeverage()

    const rebalanceNeeded = this.isRebalanceNeeded({leverage})
    if (rebalanceNeeded) {

    }

  }

}