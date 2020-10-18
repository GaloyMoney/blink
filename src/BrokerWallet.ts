import { find } from "lodash";
import { accountBrokerFtxPath, brokerPath } from "./ledger";
import { MainBook } from "./mongodb";
import { OnChainMixin } from "./OnChain";
import { Price } from "./priceImpl";
import { ILightningWalletUser } from "./types";
import { btc2sat, sleep } from "./utils";
import { UserWallet } from "./wallet";
const using = require('bluebird').using
const util = require('util')
const ccxt = require('ccxt')
const assert = require('assert')

const apiKey = process.env.FTX_KEY
const secret = process.env.FTX_SECRET

const LOW_BOUND_RATIO_SHORTING = 0.96
const LOW_SAFEBOUND_RATIO_SHORTING = 0.98
// average: 0.99
const HIGH_SAFEBOUND_RATIO_SHORTING = 1
const HIGH_BOUND_RATIO_SHORTING = 1.02

// TODO: take a target leverage and safe parameter and calculate those bounding values dynamically.
const LOW_BOUND_LEVERAGE = 1.5
const LOW_SAFEBOUND_LEVERAGE = 1.8
// average: 2
const HIGH_SAFEBOUND_LEVERAGE = 2.25
const HIGH_BOUND_LEVERAGE = 2.5

const symbol = 'BTC-PERP'


export class BrokerWallet extends OnChainMixin(UserWallet) {
  readonly currency = "BTC" 
  ftx
  price

  get accountPath(): string {
    return brokerPath
  }
  
  constructor({ uid, logger }: ILightningWalletUser) {
    super({ uid, currency: "BTC" })
    this.ftx = new ccxt.ftx({ apiKey, secret })
    this.price = new Price({ logger })
    this.logger = logger.child({ topic: "broker" })
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

    const exchange = await this.getExchangeBalance()
    const total = node + exchange

    return {
      total,
      node,
      exchange
    }
  }

  async getExchangeBalance() {
    const balance = await this.ftx.fetchBalance()
    this.logger.debug({ balance }, "this.ftx.fetchBalance result")
    return btc2sat(balance.total.BTC ?? 0)
  }

  async getAccountPosition() {
    const satsPrice = await this.price.lastPrice()
    // FIXME this helper function is inverse?
    // or because price = usd/btc, usd/sats, sat or btc are in the denominator
    // and therefore the "inverse" make sense...?
    const btcPrice = btc2sat(satsPrice) 

    // TODO: what is being returned if no order had been placed?
    // probably an empty array

    // const result = await this.ftx.privateGetAccount()
    // console.log(util.inspect({ result }, { showHidden: false, depth: null }))    
    // console.log(this.ftx.privateGetAccount)

    const { result: { collateral, positions, chargeInterestOnNegativeUsd, marginFraction } } = await this.ftx.privateGetAccount()
    this.logger.debug({collateral, positions, chargeInterestOnNegativeUsd, marginFraction}, "this.ftx.privateGetAccount result")

    const positionBtcPerp = find(positions, { future: symbol } )
    this.logger.debug({positionBtcPerp}, "positionBtcPerp result")

    // {
    //   "level": 20,
    //   "time": 1602973260135,
    //   "pid": 97313,
    //   "hostname": "prometheus-client-86dcdb9776-2cc7v",
    //   "module": "cron",
    //   "topic": "broker",
    //   "positionBtcPerp": {
    //     "collateralUsed": 9.75111,
    //     "cost": -97.5111,
    //     "entryPrice": 11338.5,
    //     "estimatedLiquidationPrice": 19757.17571032585,
    //     "future": "BTC-PERP",
    //     "initialMarginRequirement": 0.1,
    //     "longOrderSize": 0,
    //     "maintenanceMarginRequirement": 0.03,
    //     "netSize": -0.0086,
    //     "openSize": 0.0086,
    //     "realizedPnl": 0.0172,
    //     "shortOrderSize": 0,
    //     "side": "sell",
    //     "size": 0.0086,
    //     "unrealizedPnl": 0
    //   },
    //   "msg": "positionBtcPerp result"
    // }

    const { netSize = 0, estimatedLiquidationPrice, collateralUsed, maintenanceMarginRequirement } = positionBtcPerp ?? {}

    // TODO: check this is the intended settings
    assert(chargeInterestOnNegativeUsd === true)

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
      
      collateral, // in USD

      // if there is no collateral, marginFraction will be null. this is equivalent to infinite leverage. 
      leverage : marginFraction ? 1 / marginFraction : Number.POSITIVE_INFINITY,
    }
  }

  static getExposureRatio({ usdLiability, usdExposure }) {
    return {
      ratio: usdExposure / usdLiability,
      diff: usdExposure - usdLiability
    }
  }

  // we need to rebalance when price is increasing/decreasing.
  // if price increase, then the short position risk being liquidated
  // so we need to sned btc from the node to the exchange
  // if price decrease, then there would be too much btc on the exchange
  // the account won't be at the irsk of being liquidated in this case
  // but then the custody risk of the exchange increases
  static isRebalanceNeeded({ usdLiability, btcPrice, usdCollateral }) {

    type IDepositOrWithdraw = "withdraw" | "deposit" | null

    let btcAmount, usdAmountDiff
    let depositOrWithdraw: IDepositOrWithdraw = null

    if (!usdLiability) {
      return { depositOrWithdraw }
    }

    // this is an approximation of leverage, because usdLiability is an internal value
    // and not necessary exactly 100% of what is in the exchange
    // ie: it should be bounded by 
    // const LOW_SAFEBOUND_RATIO_SHORTING = 0.98 
    // and
    // const HIGH_SAFEBOUND_RATIO_SHORTING = 1
    const leverage = usdLiability / usdCollateral

    // under leveraged
    // no imminent risk (beyond exchange custory risk)
    if (leverage < LOW_BOUND_LEVERAGE) {
      const targetUsdCollateral = usdLiability / LOW_SAFEBOUND_LEVERAGE
      usdAmountDiff = usdCollateral - targetUsdCollateral
      depositOrWithdraw =  "withdraw"
    }

    // over leveraged
    // our collateral could get liquidated if we don't rebalance
    else if (leverage  > HIGH_BOUND_LEVERAGE) {
      const targetUsdCollateral = usdLiability / HIGH_SAFEBOUND_LEVERAGE
      usdAmountDiff = targetUsdCollateral - usdCollateral
      depositOrWithdraw = "deposit"
    }

    btcAmount = usdAmountDiff / btcPrice

    if (!!depositOrWithdraw) {
      assert(btcAmount > 0)
      // amount more than 3x of collateral should not happen
      // although it could happen the first time the broker is launched? 
      assert(btcAmount < 3 * usdLiability * btcPrice)
    }

    return { btcAmount, depositOrWithdraw }
  }

  static isOrderNeeded({ usdLiability, usdExposure, btcPrice }) {

    const {ratio} = this.getExposureRatio({ usdLiability, usdExposure })

    type IBuyOrSell = "sell" | "buy" | null

    let usdOrderAmount, btcAmount
    let buyOrSell: IBuyOrSell = null

    try {
      // long (exposed to change in price in BTC)
      // will loose money if BTCUSD price drops
      if (ratio < LOW_BOUND_RATIO_SHORTING) {
        const targetUsd = usdLiability * LOW_SAFEBOUND_RATIO_SHORTING
        usdOrderAmount = targetUsd - usdExposure
        buyOrSell = "sell"
      }

      // short (exposed to change in price in BTC)
      // will loose money if BTCUSD price increase
      else if (ratio > HIGH_BOUND_RATIO_SHORTING) {
        const targetUsd = usdLiability * HIGH_SAFEBOUND_RATIO_SHORTING
        usdOrderAmount = usdExposure - targetUsd
        buyOrSell = "buy"
      }

      // else:
      // we have no, or next to none, exposure to change in price in BTC

    } catch (err) {
      throw Error("can't calculate hedging value")
    }

    btcAmount = usdOrderAmount / btcPrice

    if (!!buyOrSell) {
      assert(btcAmount >= 0)
      // assert(usdOrderAmount < usdLiability)
      // TODO: should be reduce only
    }

    return { btcAmount, buyOrSell }
  }

  async rebalance ({ btcAmount, depositOrWithdraw, logger }) {
    const metadata = { type: "exchange_rebalance", currency: this.currency }

    // deposit and withdraw are from the exchange point of view
    if (depositOrWithdraw === "withdraw") {
      const memo = `withdrawal of ${btcAmount} btc from ${this.ftx.name}`

      // getLastOnChainAddress() could be used with whitelisting for more security
      const address = await this.getLastOnChainAddress()

      // TODO: need a withdrawal password?
      // FIXME: No fees? event the on-chain fees?
      const currency = "BTC"

      let withdrawalResult 

      const subLogger = logger.child({...metadata, memo, address, currency})

      try {
        withdrawalResult = await this.ftx.withdraw(currency, btcAmount, address)
      } catch(err) { 
        const error = "this.ftx.withdraw() error issue"
        subLogger.error({withdrawalResult}, error)
        throw new Error(err)
      }

      // from ccxt. could be different for ftx
      //
      //   {
      //     'info':      { ... },    // the JSON response from the exchange as is
      //     'id':       '123456',    // exchange-specific transaction id, string
      //     'txid':     '0x68bfb29821c50ca35ef3762f887fd3211e4405aba1a94e448a4f218b850358f0',
      //     'timestamp': 1534081184515,             // timestamp in milliseconds
      //     'datetime': '2018-08-12T13:39:44.515Z', // ISO8601 string of the timestamp
      //     'addressFrom': '0x38b1F8644ED1Dbd5DcAedb3610301Bf5fa640D6f', // sender
      //     'address':  '0x02b0a9b7b4cDe774af0f8e47cb4f1c2ccdEa0806', // "from" or "to"
      //     'addressTo': '0x304C68D441EF7EB0E2c056E836E8293BD28F8129', // receiver
      //     'tagFrom', '0xabcdef', // "tag" or "memo" or "payment_id" associated with the sender
      //     'tag':      '0xabcdef' // "tag" or "memo" or "payment_id" associated with the address
      //     'tagTo': '0xhijgklmn', // "tag" or "memo" or "payment_id" associated with the receiver
      //     'type':     'deposit',   // or 'withdrawal', string
      //     'amount':    1.2345,     // float (does not include the fee)
      //     'currency': 'ETH',       // a common unified currency code, string
      //     'status':   'pending',   // 'ok', 'failed', 'canceled', string
      //     'updated':   undefined,  // UTC timestamp of most recent status change in ms
      //     'comment':  'a comment or message defined by the user if any',
      //     'fee': {                 // the entire fee structure may be undefined
      //         'currency': 'ETH',   // a unified fee currency code
      //         'cost': 0.1234,      // float
      //         'rate': undefined,   // approximately, fee['cost'] / amount, float
      //     },
      // }

      if (withdrawalResult.success) {
      // TODO: ^^^^^^ check syntax

        await MainBook.entry()
        .debit(accountBrokerFtxPath, btc2sat(btcAmount), {...metadata, memo})
        .credit(this.accountPath, btc2sat(btcAmount), {...metadata, memo})
        .commit()

      } else {
        subLogger.error({withdrawalResult}, `withdrawal was not succesful`)
      }

    } else if (depositOrWithdraw === "deposit") {
      const memo = `deposit of ${btcAmount} btc to ${this.ftx.name}`
      const address = await this.exchangeDepositAddress()
      await this.onChainPay({address, amount: btc2sat(btcAmount), memo })

      // onChainPay is doing:
      //
      // await MainBook.entry(memo)
      // .debit(lightningAccountingPath, sats, metadata)
      // .credit(this.accountPath, sats, metadata)
      // .commit()
      //
      // we're doing 2 transactions here on medici.
      // explore a way to refactor this to make a single transaction.

      await MainBook.entry()
        .debit(this.accountPath, btc2sat(btcAmount), {...metadata, memo})
        .credit(accountBrokerFtxPath, btc2sat(btcAmount), {...metadata, memo})
        .commit()

    }
  }

  async executeOrder({ buyOrSell, btcAmount }) {

    let order, orderStatus

    // let orderId = 6103637365
    // let orderId

    // TODO: limit order
    const orderType = 'market'

    const logOrder = this.logger.child({symbol, orderType, buyOrSell, btcAmount})

    const minOrderSize = 0.0001
    if (btcAmount < minOrderSize) {
      logOrder.info({minOrderSize}, "order amount is too small, skipping order")
    }

    // TODO:
    // buy should be "reduceOnly":true

    try {
      order = await this.ftx.createOrder(symbol, orderType, buyOrSell, btcAmount)
    } catch (err) {
      logOrder.error({err}, "error placing an order")
      throw err
    }

    // FIXME: have a better way to manage latency
    // ie: use a while loop and check condition for a couple of seconds.
    // or rely on a websocket
    await sleep(5000)

    try {
      orderStatus = await this.ftx.fetchOrder(order.id)
    } catch (err) {
      logOrder.error({ err }, "error fetching order status")
      throw err
    }

    if (orderStatus.status !== "closed") {
      logOrder.error({ order, orderStatus}, "market order has not been fullfilled")
      // Pager
    } else {

      // {
      //   "level": 30,
      //   "time": 1602973199649,
      //   "pid": 97313,
      //   "hostname": "prometheus-client-86dcdb9776-2cc7v",
      //   "module": "cron",
      //   "topic": "broker",
      //   "symbol": "BTC-PERP",
      //   "orderType": "market",
      //   "buyOrSell": "sell",
      //   "btcAmount": 0.008632840028188865,
      //   "order": {
      //     "info": {
      //       "avgFillPrice": null,
      //       "clientId": null,
      //       "createdAt": "2020-10-17T22:19:54.361904+00:00",
      //       "filledSize": 0,
      //       "future": "BTC-PERP",
      //       "id": 12006176240,
      //       "ioc": true,
      //       "liquidation": false,
      //       "market": "BTC-PERP",
      //       "postOnly": false,
      //       "price": null,
      //       "reduceOnly": false,
      //       "remainingSize": 0.0086,
      //       "side": "sell",
      //       "size": 0.0086,
      //       "status": "new",
      //       "type": "market"
      //     },
      //     "id": "12006176240",
      //     "timestamp": 1602973194361,
      //     "datetime": "2020-10-17T22:19:54.361Z",
      //     "symbol": "BTC-PERP",
      //     "type": "market",
      //     "side": "sell",
      //     "amount": 0.0086,
      //     "filled": 0,
      //     "remaining": 0.0086,
      //     "status": "open"
      //   },
      //   "orderStatus": {
      //     "info": {
      //       "avgFillPrice": 11340.5,
      //       "clientId": null,
      //       "createdAt": "2020-10-17T22:19:54.361904+00:00",
      //       "filledSize": 0.0086,
      //       "future": "BTC-PERP",
      //       "id": 12006176240,
      //       "ioc": true,
      //       "liquidation": false,
      //       "market": "BTC-PERP",
      //       "postOnly": false,
      //       "price": null,
      //       "reduceOnly": false,
      //       "remainingSize": 0,
      //       "side": "sell",
      //       "size": 0.0086,
      //       "status": "closed",
      //       "type": "market"
      //     },
      //     "id": "12006176240",
      //     "timestamp": 1602973194361,
      //     "datetime": "2020-10-17T22:19:54.361Z",
      //     "symbol": "BTC-PERP",
      //     "type": "market",
      //     "side": "sell",
      //     "price": 11340.5,
      //     "amount": 0.0086,
      //     "cost": 97.5283,
      //     "average": 11340.5,
      //     "filled": 0.0086,
      //     "remaining": 0,
      //     "status": "closed"
      //   },
      //   "msg": "order placed succesfully"
      // }

      logOrder.info({ order, orderStatus }, "order placed succesfully")
    }
  }

  async updatePositionAndLeverage() {
    const satsPrice = await this.price.lastPrice()
    const btcPrice = btc2sat(satsPrice) 

    let subLogger

    try {
      const {usd: usdLiability} = await this.getLocalLiabilities()
      const {usd: usdExposure, leverage, collateral} = await this.getAccountPosition()
  
      subLogger = this.logger.child({ usdExposure, usdLiability, leverage, collateral, btcPrice })

      const { btcAmount, buyOrSell } = BrokerWallet.isOrderNeeded({ usdLiability, usdExposure, btcPrice })
      subLogger.debug({ btcAmount, buyOrSell }, "isOrderNeeded result")

      if (buyOrSell) {
        await this.executeOrder({ btcAmount, buyOrSell })

        const {usd: updatedUsdLiability } = await this.getLocalLiabilities()
        const {usd: updatedUsdExposure } = await this.getAccountPosition()

        subLogger.debug({ updatedUsdLiability, updatedUsdExposure, btcPrice }, "input for the updated isOrderNeeded after an order")
        const { buyOrSell: newBuyOrSell } = BrokerWallet.isOrderNeeded({ usdLiability: updatedUsdLiability, usdExposure: updatedUsdExposure, btcPrice })

        subLogger.debug({ newBuyOrSell }, "output for the updated isOrderNeeded after an order")
        assert(!newBuyOrSell)
      }

    } catch (err) {
      subLogger.error({err}, "error in the order loop")
    }

    try {
      const {usd: usdLiability} = await this.getLocalLiabilities()
      const {usd: usdExposure, leverage, collateral} = await this.getAccountPosition()
  
      subLogger = this.logger.child({ usdExposure, usdLiability, leverage, collateral, btcPrice })

      const { btcAmount, depositOrWithdraw } = BrokerWallet.isRebalanceNeeded({ usdLiability, btcPrice, usdCollateral: collateral })
      subLogger.debug({ btcAmount, depositOrWithdraw }, "isRebalanceNeeded result")

      subLogger.child({ btcAmount, depositOrWithdraw })

      await this.rebalance({ btcAmount, depositOrWithdraw, logger: subLogger })

      // TODO: add a check that rebalancing is no longer needed. 
      // maybe with the block time, this is not as easy?
    } catch (err) {
      subLogger.error({err}, "error in the rebalance loop")
    }

  }
}