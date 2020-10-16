import { find } from "lodash";
import { ftxAccountingPath } from "./ledger";
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

const LOW_BOUND_PRICE_EXPOSURE = 0.8
const LOW_SAFEBOUND_PRICE_EXPOSURE = 0.9
const HIGH_SAFEBOUND_PRICE_EXPOSURE = 1.1
const HIGH_BOUND_PRICE_EXPOSURE = 1.2

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
      collateral,
      leverage : 1 / marginFraction
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
  static isRebalanceNeeded({ leverage, usdCollateral, btcPrice }) {

    type IDepositOrWithdraw = "withdraw" | "deposit" | null

    let btcAmount, usdAmountDiff
    let depositOrWithdraw: IDepositOrWithdraw = null

    const usdPosition = usdCollateral / leverage

    try {
      // under leveraged
      // no imminent risk (beyond exchange custory risk)
      if (leverage < LOW_BOUND_LEVERAGE) {
        const targetUsdCollateral = usdCollateral / LOW_SAFEBOUND_LEVERAGE
        usdAmountDiff = usdPosition - targetUsdCollateral
        depositOrWithdraw =  "withdraw"
      }

      // over leveraged
      // our collateral could get liquidated if we don't rebalance
      else if (leverage > HIGH_BOUND_LEVERAGE) {
        const targetUsdCollateral = usdCollateral / HIGH_SAFEBOUND_LEVERAGE
        usdAmountDiff = targetUsdCollateral - usdPosition
        depositOrWithdraw = "deposit"
      }

    } catch (err) {
      throw Error("can't calculate rebalance")
    }

    btcAmount = usdAmountDiff / btcPrice

    if (!!depositOrWithdraw) {
      assert(btcAmount > 0)
      // amount more than 3x of collateral should not happen
      // although it could happen the first time the broker is launched? 
      assert(btcAmount < 3 * usdCollateral * btcPrice)
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
      if (ratio < LOW_BOUND_PRICE_EXPOSURE) {
        const targetUsd = usdLiability * LOW_SAFEBOUND_PRICE_EXPOSURE
        usdOrderAmount = targetUsd - usdExposure
        buyOrSell = "buy"
      }

      // short (exposed to change in price in BTC)
      // will loose money if BTCUSD price increase
      else if (ratio > HIGH_BOUND_PRICE_EXPOSURE) {
        const targetUsd = usdLiability * HIGH_SAFEBOUND_PRICE_EXPOSURE
        usdOrderAmount = usdExposure - targetUsd
        buyOrSell = "sell"
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

  async rebalance ({ btcAmount, depositOrWithdraw }) {
    const metadata = { type: "exchange_rebalance", currency: this.currency }

    // deposit and withdraw are from the exchange point of view
    if (depositOrWithdraw === "withdraw") {
      const memo = `withdrawal of ${btcAmount} btc from ${this.ftx.name}`

      const address = await this.getOnChainAddress()

      // TODO: need a withdrawal password?
      // FIXME: No fees? event the on-chain fees?
      const currency = "BTC"
      const withdrawal = await this.ftx.withdraw(currency, btcAmount, address)
      this.logger.debug({withdrawal, currency, btcAmount, address}, "this.ftx.withdraw()")

      //
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

      if (withdrawal.success) {
      // TODO: ^^^^^^ check syntax

        await MainBook.entry()
        .debit(ftxAccountingPath, btc2sat(btcAmount), {...metadata, memo})
        .credit(this.accountPath, btc2sat(btcAmount), {...metadata, memo})
        .commit()

      } else {
        this.logger.error({...metadata, memo, withdrawal}, `withdrawal was not succesful`)
      }

    } else if (depositOrWithdraw === "deposit") {
      const memo = `deposit of ${btcAmount} btc to ${this.ftx.name}`
      const address = await this.exchangeDepositAddress()
      await this.onChainPay({address, amount: btcAmount, memo })

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
        .credit(ftxAccountingPath, btc2sat(btcAmount), {...metadata, memo})
        .commit()

    }
  }

  async executeOrder({ buyOrSell, btcAmount }) {

    let order, orderStatus

    // let orderId = 6103637365
    // let orderId

    const orderType = 'market'
    const logOrder = this.logger.child({symbol, orderType, buyOrSell, btcAmount})

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
      logOrder.info({ order, orderStatus }, "order placed succesfully")
    }
  }

  async updatePositionAndLeverage() {
    const satsPrice = await this.price.lastPrice()
    const btcPrice = btc2sat(satsPrice) 

    const {usd: usdLiability} = await this.getLocalLiabilities()
    const {usd: usdExposure, leverage, collateral} = await this.getAccountPosition()

    this.logger.debug({ usdExposure, usdLiability, leverage, collateral, btcPrice }, "input for the broker algos")
    
    {
      const { btcAmount, buyOrSell } = BrokerWallet.isOrderNeeded({ usdLiability, usdExposure, btcPrice })
      this.logger.debug({ btcAmount, buyOrSell }, "isOrderNeeded result")

      if (buyOrSell) {
        await this.executeOrder({ btcAmount, buyOrSell })

        const {usd: updatedUsdLiability } = await this.getLocalLiabilities()
        const {usd: updatedUsdExposure } = await this.getAccountPosition()
        this.logger.debug({ usdExposure, usdLiability, leverage, collateral, btcPrice }, "input for the updated isOrderNeeded after an order")
        const { buyOrSell: newBuyOrSell } = BrokerWallet.isOrderNeeded({ usdLiability: updatedUsdLiability, usdExposure: updatedUsdExposure, btcPrice })

        this.logger.debug({ newBuyOrSell }, "output for the updated isOrderNeeded after an order")
        assert(!newBuyOrSell)
      }
    }

    {
      const { btcAmount, depositOrWithdraw } = BrokerWallet.isRebalanceNeeded({ leverage, usdCollateral: collateral, btcPrice })
      await this.rebalance({ btcAmount, depositOrWithdraw })

      this.logger.debug({ btcAmount, depositOrWithdraw }, "isRebalanceNeeded result")

      // TODO: add a check that rebalancing is no longer needed. 
      // maybe with the block time, this is not as easy?
    }

  }
}