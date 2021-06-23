import _ from "lodash"
import { yamlConfig } from "../config"
import { accountDealerFtxPath, liabilitiesDealerFtxPath } from "../ledger/ledger"
import { MainBook } from "../mongodb"
import { OnChainMixin } from "../OnChain"
import { ILightningWalletUser } from "../types"
import { btc2sat, sleep } from "../utils"
import { baseLogger } from "../logger"
import { UserWallet } from "../userWallet"
import ccxt from "ccxt"
import assert from "assert"

const apiKey = process.env.FTX_KEY
const secret = process.env.FTX_SECRET

const symbol = "BTC-PERP"

// TODO: move to the yaml config
const simulateOnly = true

export type IBuyOrSell = "sell" | "buy" | null

// FtxDealer is a user of the wallet, therefore we are inheriting from UserWallet
// FtxDealer is interacting with Ftx through bitcoin layer 1,
// so it is using the OnChain Mixin.
export class FtxDealerWallet extends OnChainMixin(UserWallet) {
  ftx

  constructor({ user, logger }: ILightningWalletUser) {
    super({ user, logger })
    this.ftx = new ccxt.ftx({ apiKey, secret })
    this.logger = logger.child({ topic: "dealer" })
  }

  async getLocalLiabilities() {
    // FIXME harmonize the capitalzation for USD/usd
    const { USD, BTC: satsLnd } = await this.getBalances()

    // TODO: calculate PnL for the dealer
    // this will influence this account.
    const { balance: satsFtx } = await MainBook.balance({
      account: liabilitiesDealerFtxPath,
      currency: "BTC",
    })

    return {
      // dealer is the only one account with the a negative balance for USD
      // FIXME: look if there is a cleaner design than just have a - sign here
      usd: -USD,
      satsLnd,
      satsFtx,
    }
  }

  async has() {
    return this.ftx.has
  }

  async createDepositAddress() {
    // create a new address
    // is not enabled on FTX
    // return this.ftx.createDepositAddress("BTC")
    return Error("not implemented")
  }

  async exchangeDepositAddress() {
    // same address is returned each time
    const { address } = await this.ftx.fetchDepositAddress("BTC")
    return address
  }

  async satsBalance() {
    const { satsLnd: nodeLiabilities } = await this.getLocalLiabilities()
    const node = -nodeLiabilities

    // at least on FTX. interest will be charged when below -$30,000.
    // TODO: manage this part

    const { sats: exchange } = await this.getExchangeBalance()
    const total = node + exchange

    return {
      total,
      node,
      exchange,
    }
  }

  async getProfit() {
    const { total: sats } = await this.satsBalance()
    const usdAssetsInBtc = sats * UserWallet.lastPrice

    const { usd: usdLiabilities } = await this.getLocalLiabilities()

    const { usdPnl } = await this.getExchangeBalance()

    const usdProfit = usdAssetsInBtc + usdPnl - usdLiabilities

    return {
      usdProfit,
    }
  }

  async getExchangeBalance() {
    const balance = await this.ftx.fetchBalance()
    this.logger.debug({ balance }, "this.ftx.fetchBalance result")
    return {
      sats: btc2sat(balance.total.BTC ?? 0),
      usdPnl: balance.total.USD,
    }
  }

  async getNextFundingRate() {
    const {
      result: { nextFundingRate },
    } = await this.ftx.publicGetFuturesFutureNameStats({ future_name: symbol })
    return nextFundingRate
  }

  async getAccountPosition() {
    // FIXME this helper function is inverse?
    // or because price = usd/btc, usd/sats, sat or btc are in the denominator
    // and therefore the "inverse" make sense...?
    const btcPrice = btc2sat(UserWallet.lastPrice)

    this.logger.debug({ btcPrice }, "[DEBUG] is price set for the dealer?")

    // TODO: what is being returned if no order had been placed?
    // probably an empty array

    // tmp for log
    const result = await this.ftx.privateGetAccount()
    this.logger.debug({ result }, "full result of this.ftx.privateGetAccount")

    const {
      result: {
        collateral,
        positions,
        chargeInterestOnNegativeUsd,
        marginFraction,
        totalAccountValue,
      },
    } = result
    this.logger.debug(
      { collateral, positions, chargeInterestOnNegativeUsd, marginFraction },
      "value kept from this.ftx.privateGetAccount",
    )

    const positionBtcPerp = _.find(positions, { future: symbol })
    this.logger.debug({ positionBtcPerp }, "positionBtcPerp result")

    // {
    //   "level": 20,
    //   "time": 1602973260135,
    //   "pid": 97313,
    //   "hostname": "metrics-86dcdb9776-2cc7v",
    //   "module": "cron",
    //   "topic": "dealer",
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

    const {
      netSize = 0,
      estimatedLiquidationPrice,
      collateralUsed,
      maintenanceMarginRequirement,
    } = positionBtcPerp ?? {}

    // TODO: check this is the intended settings
    assert(chargeInterestOnNegativeUsd === true)

    assert(netSize <= 0)

    return {
      // making netSize positive to simplify calculation
      // we should always be short so netSize should initially
      // always be negative
      btc: -netSize,

      usd: -netSize * btcPrice,
      estimatedLiquidationPrice,
      collateralUsed, // USD
      maintenanceMarginRequirement, // start at 0.03 but increase with position side

      collateral, // in USD

      totalAccountValue,

      // if there is no collateral, marginFraction will be null. this is equivalent to infinite leverage.
      leverage: marginFraction ? 1 / marginFraction : Number.POSITIVE_INFINITY,
    }
  }

  static getExposureRatio({ usdLiability, usdExposure }) {
    return {
      ratio: usdExposure / usdLiability,
      diff: usdExposure - usdLiability,
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

    let usdAmountDiff
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
    if (leverage < yamlConfig.hedging.LOW_BOUND_LEVERAGE) {
      const targetUsdCollateral = usdLiability / yamlConfig.hedging.LOW_SAFEBOUND_LEVERAGE
      usdAmountDiff = usdCollateral - targetUsdCollateral
      depositOrWithdraw = "withdraw"
    }

    // over leveraged
    // our collateral could get liquidated if we don't rebalance
    else if (leverage > yamlConfig.hedging.HIGH_BOUND_LEVERAGE) {
      const targetUsdCollateral =
        usdLiability / yamlConfig.hedging.HIGH_SAFEBOUND_LEVERAGE
      usdAmountDiff = targetUsdCollateral - usdCollateral
      depositOrWithdraw = "deposit"
    }

    const btcAmount = usdAmountDiff / btcPrice

    if (depositOrWithdraw) {
      assert(btcAmount > 0)
      // amount more than 3x of collateral should not happen
      // although it could happen the first time the dealer is launched?
      assert(btcAmount < 3 * usdLiability * btcPrice)
    }

    return { btcAmount, depositOrWithdraw }
  }

  static isOrderNeeded({ usdLiability, usdExposure, btcPrice }) {
    const { ratio } = this.getExposureRatio({ usdLiability, usdExposure })

    let usdOrderAmount
    let buyOrSell: IBuyOrSell = null

    yamlConfig.hedging.LOW_SAFEBOUND_RATIO_SHORTING

    try {
      // long (exposed to change in price in BTC)
      // will loose money if BTCUSD price drops
      if (ratio < yamlConfig.hedging.LOW_BOUND_RATIO_SHORTING) {
        const targetUsd = usdLiability * yamlConfig.hedging.LOW_SAFEBOUND_RATIO_SHORTING
        usdOrderAmount = targetUsd - usdExposure
        buyOrSell = "sell"
      }

      // short (exposed to change in price in BTC)
      // will loose money if BTCUSD price increase
      else if (ratio > yamlConfig.hedging.HIGH_BOUND_RATIO_SHORTING) {
        const targetUsd = usdLiability * yamlConfig.hedging.HIGH_SAFEBOUND_RATIO_SHORTING
        usdOrderAmount = usdExposure - targetUsd
        buyOrSell = "buy"
      }

      // else:
      // we have no, or next to none, exposure to change in price in BTC
    } catch (err) {
      throw Error("can't calculate hedging value")
    }

    const btcAmount = usdOrderAmount / btcPrice

    if (buyOrSell) {
      assert(btcAmount >= 0)
      // assert(usdOrderAmount < usdLiability)
      // TODO: should be reduce only
    }

    return { btcAmount, buyOrSell }
  }

  async rebalance({ btcAmount, depositOrWithdraw, logger }) {
    const currency = "BTC"
    const sats = btc2sat(btcAmount)

    const metadata = {
      type: "exchange_rebalance",
      currency,
      ...UserWallet.getCurrencyEquivalent({ sats, fee: 0 }),
    }

    let subLogger = logger.child({ ...metadata, btcAmount, depositOrWithdraw })

    // deposit and withdraw are from the exchange point of view
    if (depositOrWithdraw === "withdraw") {
      const memo = `withdrawal of ${btcAmount} btc from ${this.ftx.name}`

      // TODO: manage the case of
      // "Account needs to have positive USD balances"

      // getLastOnChainAddress() could be used with whitelisting for more security
      const address = await this.getLastOnChainAddress()

      // TODO: need a withdrawal password?
      // FIXME: No fees? event the on-chain fees?

      let withdrawalResult

      subLogger = subLogger.child({ memo, address })

      try {
        withdrawalResult = await this.ftx.withdraw(currency, btcAmount, address)
      } catch (err) {
        const error = "this.ftx.withdraw() error issue"
        subLogger.error({ withdrawalResult }, error)
        throw new Error(err)
      }

      // this.ftx.withdraw documentation from from ccxt.
      // could be different for ftx
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

      if (withdrawalResult.status === "requested") {
        // TODO: wait until request succeed before updating tx

        // updateOnchainReceipt() doing:
        //
        // await MainBook.entry()
        // .credit(this.user.accountPath, sats, metadata)
        // .debit(lndAccountingPath, sats, metadata)
        // .commit()

        await MainBook.entry()
          .credit(accountDealerFtxPath, sats, { ...metadata, memo })
          .debit(liabilitiesDealerFtxPath, sats, { ...metadata, memo })
          .commit()

        subLogger.info({ withdrawalResult }, `rebalancing withdrawal was succesful`)
      } else {
        // {
        //   "level": 50,
        //   "time": 1603075865330,
        //   "pid": 213504,
        //   "hostname": "metrics-86dcdb9776-2cc7v",
        //   "module": "cron",
        //   "topic": "dealer",
        //   "usdExposure": 41.313841239888,
        //   "usdLiability": 40.31493016,
        //   "leverage": 0.9689446654606045,
        //   "collateral": 42.59976743455,
        //   "btcPrice": 11476.06701108,
        //   "type": "exchange_rebalance",
        //   "currency": "BTC",
        //   "memo": "withdrawal of 0.0017604100771477227 btc from FTX",
        //   "address": "bc1q7xahyx5je3dzjdprj7z3wdtvs3gyn8d2fa4dka",
        //   "withdrawalResult": {
        //     "info": {
        //       "address": "bc1q7xahyx5je3dzjdprj7z3wdtvs3gyn8d2fa4dka",
        //       "coin": "BTC",
        //       "fee": 0,
        //       "id": 421976,
        //       "size": 0.00176041,
        //       "status": "requested",
        //       "tag": null,
        //       "time": "2020-10-19T02:51:02.390072+00:00",
        //       "txid": null
        //     },
        //     "id": "421976",
        //     "timestamp": 1603075862390,
        //     "datetime": "2020-10-19T02:51:02.390Z",
        //     "address": "bc1q7xahyx5je3dzjdprj7z3wdtvs3gyn8d2fa4dka",
        //     "addressTo": "bc1q7xahyx5je3dzjdprj7z3wdtvs3gyn8d2fa4dka",
        //     "type": "deposit",
        //     "amount": 0.00176041,
        //     "currency": "BTC",
        //     "status": "requested",
        //     "fee": {
        //       "currency": "BTC",
        //       "cost": 0
        //     }
        //   },
        //   "msg": "withdrawal was not succesful"
        // }

        subLogger.error({ withdrawalResult }, `rebalancing withdrawal was not succesful`)
      }
    } else if (depositOrWithdraw === "deposit") {
      const memo = `deposit of ${btcAmount} btc to ${this.ftx.name}`
      const address = await this.exchangeDepositAddress()
      await this.onChainPay({ address, amount: sats, memo })

      // onChainPay is doing:
      //
      // await MainBook.entry(memo)
      //   .credit(lndAccountingPath, sats, metadata)
      //   .debit(this.user.accountPath, sats, metadata)
      //   .commit()
      //
      // we're doing 2 transactions here on medici.
      // explore a way to refactor this to make a single transaction.

      await MainBook.entry()
        .credit(liabilitiesDealerFtxPath, sats, { ...metadata, memo })
        .debit(accountDealerFtxPath, sats, { ...metadata, memo })
        .commit()

      subLogger.info({ memo, address }, "deposit rebalancing succesful")
    }
  }

  async executeOrder({ buyOrSell, btcAmount }) {
    let order, orderStatus

    // let orderId = 6103637365
    // let orderId

    // TODO: limit order
    const orderType = "market"

    const logOrder = this.logger.child({ symbol, orderType, buyOrSell, btcAmount })

    // TODO: min order size could be dynamically fetched from
    // https://docs.ftx.com/#get-future
    const minOrderSize = 0.0001

    if (btcAmount < minOrderSize) {
      logOrder.info({ minOrderSize }, "order amount is too small, skipping order")
    }

    // TODO:
    // buy should be "reduceOnly":true

    try {
      order = await this.ftx.createOrder(symbol, orderType, buyOrSell, btcAmount)
    } catch (err) {
      logOrder.error({ err }, "error placing an order")
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
      logOrder.error({ order, orderStatus }, "market order has not been fullfilled")
      // Pager
    } else {
      // {
      //   "level": 30,
      //   "time": 1602973199649,
      //   "pid": 97313,
      //   "hostname": "metrics-86dcdb9776-2cc7v",
      //   "module": "cron",
      //   "topic": "dealer",
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
    const btcPrice = btc2sat(UserWallet.lastPrice)

    let subLogger = this.logger
    this.logger.debug("starting with order loop")

    try {
      const { usd: usdLiability } = await this.getLocalLiabilities()
      const { usd: usdExposure, leverage, collateral } = await this.getAccountPosition()

      subLogger = subLogger.child({
        usdExposure,
        usdLiability,
        leverage,
        collateral,
        btcPrice,
      })

      const { btcAmount, buyOrSell } = FtxDealerWallet.isOrderNeeded({
        usdLiability,
        usdExposure,
        btcPrice,
      })
      subLogger.debug({ btcAmount, buyOrSell }, "isOrderNeeded result")

      if (buyOrSell && !simulateOnly) {
        await this.executeOrder({ btcAmount, buyOrSell })

        const { usd: updatedUsdLiability } = await this.getLocalLiabilities()
        const { usd: updatedUsdExposure } = await this.getAccountPosition()

        subLogger.debug(
          { updatedUsdLiability, updatedUsdExposure, btcPrice },
          "input for the updated isOrderNeeded after an order",
        )
        const { buyOrSell: newBuyOrSell } = FtxDealerWallet.isOrderNeeded({
          usdLiability: updatedUsdLiability,
          usdExposure: updatedUsdExposure,
          btcPrice,
        })

        subLogger.debug(
          { newBuyOrSell },
          "output for the updated isOrderNeeded after an order",
        )
        assert(!newBuyOrSell)
      }
    } catch (err) {
      subLogger.error({ err }, "error in the order loop")
    }

    this.logger.debug("starting with rebalance loop")

    try {
      const { usd: usdLiability } = await this.getLocalLiabilities()
      const { usd: usdExposure, leverage, collateral } = await this.getAccountPosition()

      subLogger = this.logger.child({
        usdExposure,
        usdLiability,
        leverage,
        collateral,
        btcPrice,
      })

      const { btcAmount, depositOrWithdraw } = FtxDealerWallet.isRebalanceNeeded({
        usdLiability,
        btcPrice,
        usdCollateral: collateral,
      })
      subLogger.debug({ btcAmount, depositOrWithdraw }, "isRebalanceNeeded result")

      if (!simulateOnly) {
        await this.rebalance({ btcAmount, depositOrWithdraw, logger: subLogger })
      }

      // TODO: add a check that rebalancing is no longer needed.
      // maybe with the block time, this is not as easy?
    } catch (err) {
      subLogger.error({ err }, "error in the rebalance loop")
    }
  }

  protected async getFtxMethods() {
    // 0: "isBrowser"
    // 1: "isElectron"
    // 2: "isWebWorker"
    // 3: "isNode"
    // 4: "isWindows"
    // 5: "defaultFetch"
    // 6: "keys"
    // 7: "values"
    // 8: "extend"
    // 9: "clone"
    // 10: "index"
    // 11: "ordered"
    // 12: "unique"
    // 13: "arrayConcat"
    // 14: "inArray"
    // 15: "toArray"
    // 16: "isEmpty"
    // 17: "keysort"
    // 18: "indexBy"
    // 19: "groupBy"
    // 20: "filterBy"
    // 21: "sortBy"
    // 22: "flatten"
    // 23: "pluck"
    // 24: "omit"
    // 25: "sum"
    // 26: "deepExtend"
    // 27: "uuid"
    // 28: "unCamelCase"
    // 29: "capitalize"
    // 30: "strip"
    // 31: "isNumber"
    // 32: "isInteger"
    // 33: "isArray"
    // 34: "isObject"
    // 35: "isString"
    // 36: "isStringCoercible"
    // 37: "isDictionary"
    // 38: "hasProps"
    // 39: "prop"
    // 40: "asFloat"
    // 41: "asInteger"
    // 42: "safeFloat"
    // 43: "safeInteger"
    // 44: "safeIntegerProduct"
    // 45: "safeTimestamp"
    // 46: "safeValue"
    // 47: "safeString"
    // 48: "safeStringLower"
    // 49: "safeStringUpper"
    // 50: "safeFloat2"
    // 51: "safeInteger2"
    // 52: "safeIntegerProduct2"
    // 53: "safeTimestamp2"
    // 54: "safeValue2"
    // 55: "safeString2"
    // 56: "safeStringLower2"
    // 57: "safeStringUpper2"
    // 58: "toWei"
    // 59: "fromWei"
    // 60: "numberToString"
    // 61: "precisionFromString"
    // 62: "decimalToPrecision"
    // 63: "truncate_to_string"
    // 64: "truncate"
    // 65: "precisionConstants"
    // 66: "ROUND"
    // 67: "TRUNCATE"
    // 68: "ROUND_UP"
    // 69: "ROUND_DOWN"
    // 70: "DECIMAL_PLACES"
    // 71: "SIGNIFICANT_DIGITS"
    // 72: "TICK_SIZE"
    // 73: "NO_PADDING"
    // 74: "PAD_WITH_ZERO"
    // 75: "json"
    // 76: "unjson"
    // 77: "isJsonEncodedObject"
    // 78: "stringToBinary"
    // 79: "stringToBase64"
    // 80: "base64ToBinary"
    // 81: "base64ToString"
    // 82: "binaryToBase64"
    // 83: "base16ToBinary"
    // 84: "binaryToBase16"
    // 85: "binaryConcat"
    // 86: "binaryConcatArray"
    // 87: "urlencode"
    // 88: "urlencodeWithArrayRepeat"
    // 89: "rawencode"
    // 90: "encode"
    // 91: "decode"
    // 92: "urlencodeBase64"
    // 93: "numberToLE"
    // 94: "numberToBE"
    // 95: "base58ToBinary"
    // 96: "binaryToBase58"
    // 97: "byteArrayToWordArray"
    // 98: "hash"
    // 99: "hmac"
    // 100: "jwt"
    // 101: "totp"
    // 102: "rsa"
    // 103: "ecdsa"
    // 104: "eddsa"
    // 105: "now"
    // 106: "microseconds"
    // 107: "milliseconds"
    // 108: "seconds"
    // 109: "iso8601"
    // 110: "parse8601"
    // 111: "rfc2616"
    // 112: "uuidv1"
    // 113: "parseDate"
    // 114: "mdy"
    // 115: "ymd"
    // 116: "ymdhms"
    // 117: "setTimeout_safe"
    // 118: "sleep"
    // 119: "TimedOut"
    // 120: "timeout"
    // 121: "throttle"
    // 122: "aggregate"
    // 123: "parseTimeframe"
    // 124: "roundTimeframe"
    // 125: "buildOHLCVC"
    // 126: "implodeParams"
    // 127: "extractParams"
    // 128: "vwap"
    // 129: "is_browser"
    // 130: "is_electron"
    // 131: "is_web_worker"
    // 132: "is_node"
    // 133: "is_windows"
    // 134: "default_fetch"
    // 135: "array_concat"
    // 136: "in_array"
    // 137: "to_array"
    // 138: "is_empty"
    // 139: "index_by"
    // 140: "group_by"
    // 141: "filter_by"
    // 142: "sort_by"
    // 143: "deep_extend"
    // 144: "un_camel_case"
    // 145: "is_number"
    // 146: "is_integer"
    // 147: "is_array"
    // 148: "is_object"
    // 149: "is_string"
    // 150: "is_string_coercible"
    // 151: "is_dictionary"
    // 152: "has_props"
    // 153: "as_float"
    // 154: "as_integer"
    // 155: "safe_float"
    // 156: "safe_integer"
    // 157: "safe_integer_product"
    // 158: "safe_timestamp"
    // 159: "safe_value"
    // 160: "safe_string"
    // 161: "safe_string_lower"
    // 162: "safe_string_upper"
    // 163: "safe_float2"
    // 164: "safe_integer2"
    // 165: "safe_integer_product2"
    // 166: "safe_timestamp2"
    // 167: "safe_value2"
    // 168: "safe_string2"
    // 169: "safe_string_lower2"
    // 170: "safe_string_upper2"
    // 171: "to_wei"
    // 172: "from_wei"
    // 173: "number_to_string"
    // 174: "precision_from_string"
    // 175: "decimal_to_precision"
    // 176: "precision_constants"
    // 177: "is_json_encoded_object"
    // 178: "string_to_binary"
    // 179: "string_to_base64"
    // 180: "base64_to_binary"
    // 181: "base64_to_string"
    // 182: "binary_to_base64"
    // 183: "base16_to_binary"
    // 184: "binary_to_base16"
    // 185: "binary_concat"
    // 186: "binary_concat_array"
    // 187: "urlencode_with_array_repeat"
    // 188: "urlencode_base64"
    // 189: "number_to_le"
    // 190: "number_to_be"
    // 191: "base58_to_binary"
    // 192: "binary_to_base58"
    // 193: "byte_array_to_word_array"
    // 194: "parse_date"
    // 195: "set_timeout_safe"
    // 196: "timed_out"
    // 197: "parse_timeframe"
    // 198: "round_timeframe"
    // 199: "build_ohlcvc"
    // 200: "implode_params"
    // 201: "extract_params"
    // 202: "options"
    // 203: "fetchOptions"
    // 204: "userAgents"
    // 205: "headers"
    // 206: "proxy"
    // 207: "origin"
    // 208: "minFundingAddressLength"
    // 209: "substituteCommonCurrencyCodes"
    // 210: "fetchImplementation"
    // 211: "verbose"
    // 212: "debug"
    // 213: "userAgent"
    // 214: "twofa"
    // 215: "apiKey"
    // 216: "secret"
    // 217: "uid"
    // 218: "login"
    // 219: "password"
    // 220: "privateKey"
    // 221: "walletAddress"
    // 222: "token"
    // 223: "balance"
    // 224: "orderbooks"
    // 225: "tickers"
    // 226: "orders"
    // 227: "trades"
    // 228: "transactions"
    // 229: "ohlcvs"
    // 230: "myTrades"
    // 231: "requiresWeb3"
    // 232: "requiresEddsa"
    // 233: "precision"
    // 234: "enableLastJsonResponse"
    // 235: "enableLastHttpResponse"
    // 236: "enableLastResponseHeaders"
    // 237: "last_http_response"
    // 238: "last_json_response"
    // 239: "last_response_headers"
    // 240: "fetch_options"
    // 241: "user_agents"
    // 242: "min_funding_address_length"
    // 243: "substitute_common_currency_codes"
    // 244: "fetch_implementation"
    // 245: "user_agent"
    // 246: "api_key"
    // 247: "private_key"
    // 248: "wallet_address"
    // 249: "my_trades"
    // 250: "requires_web3"
    // 251: "requires_eddsa"
    // 252: "enable_last_json_response"
    // 253: "enable_last_http_response"
    // 254: "enable_last_response_headers"
    // 255: "constructor"
    // 256: "describe"
    // 257: "fetch_currencies"
    // 258: "fetch_markets"
    // 259: "parse_ticker"
    // 260: "fetch_ticker"
    // 261: "parse_tickers"
    // 262: "fetch_tickers"
    // 263: "fetch_order_book"
    // 264: "parse_ohlcv"
    // 265: "get_market_id"
    // 266: "get_market_params"
    // 267: "fetch_ohlcv"
    // 268: "parse_trade"
    // 269: "fetch_trades"
    // 270: "fetch_trading_fees"
    // 271: "fetch_balance"
    // 272: "parse_order_status"
    // 273: "parse_order"
    // 274: "create_order"
    // 275: "cancel_order"
    // 276: "cancel_all_orders"
    // 277: "fetch_order"
    // 278: "fetch_open_orders"
    // 279: "fetch_orders"
    // 280: "fetch_my_trades"
    // 281: "withdraw"
    // 282: "fetch_deposit_address"
    // 283: "parse_transaction_status"
    // 284: "parse_transaction"
    // 285: "fetch_deposits"
    // 286: "fetch_withdrawals"
    // 287: "sign"
    // 288: "handle_errors"
    // 289: "defaults"
    // 290: "nonce"
    // 291: "encode_uri_component"
    // 292: "check_required_credentials"
    // 293: "check_address"
    // 294: "init_rest_rate_limiter"
    // 295: "set_sandbox_mode"
    // 296: "define_rest_api"
    // 297: "print"
    // 298: "set_headers"
    // 299: "fetch"
    // 300: "fetch2"
    // 301: "request"
    // 302: "parse_json"
    // 303: "throw_exactly_matched_exception"
    // 304: "throw_broadly_matched_exception"
    // 305: "find_broadly_matched_key"
    // 306: "default_error_handler"
    // 307: "get_response_headers"
    // 308: "handle_rest_response"
    // 309: "set_markets"
    // 310: "load_markets_helper"
    // 311: "load_markets"
    // 312: "load_accounts"
    // 313: "fetch_bids_asks"
    // 314: "fetch_ohlcvc"
    // 315: "parse_trading_view_ohlcv"
    // 316: "convert_trading_view_to_ohlcv"
    // 317: "convert_ohlcv_to_trading_view"
    // 318: "purge_cached_orders"
    // 319: "fetch_unified_order"
    // 320: "cancel_unified_order"
    // 321: "fetch_closed_orders"
    // 322: "fetch_transactions"
    // 323: "fetch_order_status"
    // 324: "account"
    // 325: "common_currency_code"
    // 326: "currency_id"
    // 327: "currency"
    // 328: "market"
    // 329: "market_id"
    // 330: "market_ids"
    // 331: "symbol"
    // 332: "url"
    // 333: "parse_bid_ask"
    // 334: "parse_bids_asks"
    // 335: "fetch_l2_order_book"
    // 336: "parse_order_book"
    // 337: "parse_balance"
    // 338: "fetch_partial_balance"
    // 339: "fetch_free_balance"
    // 340: "fetch_used_balance"
    // 341: "fetch_total_balance"
    // 342: "fetch_status"
    // 343: "fetch_trading_fee"
    // 344: "load_trading_limits"
    // 345: "filter_by_since_limit"
    // 346: "filter_by_value_since_limit"
    // 347: "filter_by_symbol_since_limit"
    // 348: "filter_by_currency_since_limit"
    // 349: "filter_by_array"
    // 350: "parse_trades"
    // 351: "parse_transactions"
    // 352: "parse_ledger"
    // 353: "parse_orders"
    // 354: "safe_currency"
    // 355: "safe_currency_code"
    // 356: "safe_market"
    // 357: "safe_symbol"
    // 358: "filter_by_symbol"
    // 359: "parse_ohlc_vs"
    // 360: "edit_limit_buy_order"
    // 361: "edit_limit_sell_order"
    // 362: "edit_limit_order"
    // 363: "edit_order"
    // 364: "create_limit_order"
    // 365: "create_market_order"
    // 366: "create_limit_buy_order"
    // 367: "create_limit_sell_order"
    // 368: "create_market_buy_order"
    // 369: "create_market_sell_order"
    // 370: "cost_to_precision"
    // 371: "price_to_precision"
    // 372: "amount_to_precision"
    // 373: "fee_to_precision"
    // 374: "currency_to_precision"
    // 375: "calculate_fee"
    // 376: "check_required_dependencies"
    // 377: "solidity_sha3"
    // 378: "remove0x_prefix"
    // 379: "hash_message"
    // 380: "sign_hash"
    // 381: "sign_message"
    // 382: "sign_message_string"
    // 383: "oath"
    // 384: "integer_divide"
    // 385: "integer_modulo"
    // 386: "integer_pow"
    // 387: "__define_getter__"
    // 388: "__define_setter__"
    // 389: "has_own_property"
    // 390: "__lookup_getter__"
    // 391: "__lookup_setter__"
    // 392: "is_prototype_of"
    // 393: "property_is_enumerable"
    // 394: "to_string"
    // 395: "value_of"
    // 396: "to_locale_string"
    // 397: "id"
    // 398: "name"
    // 399: "countries"
    // 400: "enableRateLimit"
    // 401: "rateLimit"
    // 402: "certified"
    // 403: "pro"
    // 404: "has"
    // 405: "urls"
    // 406: "api"
    // 407: "requiredCredentials"
    // 408: "markets"
    // 409: "currencies"
    // 410: "timeframes"
    // 411: "fees"
    // 412: "status"
    // 413: "exceptions"
    // 414: "httpExceptions"
    // 415: "dontGetUsedBalanceFromStaleCache"
    // 416: "commonCurrencies"
    // 417: "precisionMode"
    // 418: "paddingMode"
    // 419: "limits"
    // 420: "hostname"
    // 421: "httpAgent"
    // 422: "httpsAgent"
    // 423: "hasLoadMarkets"
    // 424: "hasCancelAllOrders"
    // 425: "hasCancelOrder"
    // 426: "hasCancelOrders"
    // 427: "hasCORS"
    // 428: "hasCreateDepositAddress"
    // 429: "hasCreateLimitOrder"
    // 430: "hasCreateMarketOrder"
    // 431: "hasCreateOrder"
    // 432: "hasDeposit"
    // 433: "hasEditOrder"
    // 434: "hasFetchBalance"
    // 435: "hasFetchBidsAsks"
    // 436: "hasFetchClosedOrders"
    // 437: "hasFetchCurrencies"
    // 438: "hasFetchDepositAddress"
    // 439: "hasFetchDeposits"
    // 440: "hasFetchFundingFees"
    // 441: "hasFetchL2OrderBook"
    // 442: "hasFetchLedger"
    // 443: "hasFetchMarkets"
    // 444: "hasFetchMyTrades"
    // 445: "hasFetchOHLCV"
    // 446: "hasFetchOpenOrders"
    // 447: "hasFetchOrder"
    // 448: "hasFetchOrderBook"
    // 449: "hasFetchOrderBooks"
    // 450: "hasFetchOrders"
    // 451: "hasFetchOrderTrades"
    // 452: "hasFetchStatus"
    // 453: "hasFetchTicker"
    // 454: "hasFetchTickers"
    // 455: "hasFetchTime"
    // 456: "hasFetchTrades"
    // 457: "hasFetchTradingFee"
    // 458: "hasFetchTradingFees"
    // 459: "hasFetchTradingLimits"
    // 460: "hasFetchTransactions"
    // 461: "hasFetchWithdrawals"
    // 462: "hasPrivateAPI"
    // 463: "hasPublicAPI"
    // 464: "hasSignIn"
    // 465: "hasWithdraw"
    // 466: "publicGetCoins"
    // 467: "public_get_coins"
    // 468: "publicGetMarkets"
    // 469: "public_get_markets"
    // 470: "publicGetMarketsMarketName"
    // 471: "public_get_markets_market_name"
    // 472: "publicGetMarketsMarketNameOrderbook"
    // 473: "public_get_markets_market_name_orderbook"
    // 474: "publicGetMarketsMarketNameTrades"
    // 475: "public_get_markets_market_name_trades"
    // 476: "publicGetMarketsMarketNameCandles"
    // 477: "public_get_markets_market_name_candles"
    // 478: "publicGetFutures"
    // 479: "public_get_futures"
    // 480: "publicGetFuturesFutureName"
    // 481: "public_get_futures_future_name"
    // 482: "publicGetFuturesFutureNameStats"
    // 483: "public_get_futures_future_name_stats"
    // 484: "publicGetFundingRates"
    // 485: "public_get_funding_rates"
    // 486: "publicGetIndexesIndexNameWeights"
    // 487: "public_get_indexes_index_name_weights"
    // 488: "publicGetExpiredFutures"
    // 489: "public_get_expired_futures"
    // 490: "publicGetIndexesMarketNameCandles"
    // 491: "public_get_indexes_market_name_candles"
    // 492: "publicGetLtTokens"
    // 493: "public_get_lt_tokens"
    // 494: "publicGetLtTokenName"
    // 495: "public_get_lt_token_name"
    // 496: "publicGetOptionsRequests"
    // 497: "public_get_options_requests"
    // 498: "publicGetOptionsTrades"
    // 499: "public_get_options_trades"
    // 500: "publicGetStats24hOptionsVolume"
    // 501: "public_get_stats_24h_options_volume"
    // 502: "publicGetOptionsHistoricalVolumesBTC"
    // 503: "public_get_options_historical_volumes_btc"
    // 504: "publicGetOptionsOpenInterestBTC"
    // 505: "public_get_options_open_interest_btc"
    // 506: "publicGetOptionsHistoricalOpenInterestBTC"
    // 507: "public_get_options_historical_open_interest_btc"
    // 508: "privateGetAccount"
    // 509: "private_get_account"
    // 510: "privateGetPositions"
    // 511: "private_get_positions"
    // 512: "privateGetWalletCoins"
    // 513: "private_get_wallet_coins"
    // 514: "privateGetWalletBalances"
    // 515: "private_get_wallet_balances"
    // 516: "privateGetWalletAllBalances"
    // 517: "private_get_wallet_all_balances"
    // 518: "privateGetWalletDepositAddressCoin"
    // 519: "private_get_wallet_deposit_address_coin"
    // 520: "privateGetWalletDeposits"
    // 521: "private_get_wallet_deposits"
    // 522: "privateGetWalletWithdrawals"
    // 523: "private_get_wallet_withdrawals"
    // 524: "privateGetOrders"
    // 525: "private_get_orders"
    // 526: "privateGetOrdersHistory"
    // 527: "private_get_orders_history"
    // 528: "privateGetOrdersOrderId"
    // 529: "private_get_orders_order_id"
    // 530: "privateGetOrdersByClientIdClientOrderId"
    // 531: "private_get_orders_by_client_id_client_order_id"
    // 532: "privateGetConditionalOrders"
    // 533: "private_get_conditional_orders"
    // 534: "privateGetConditionalOrdersConditionalOrderIdTriggers"
    // 535: "private_get_conditional_orders_conditional_order_id_triggers"
    // 536: "privateGetConditionalOrdersHistory"
    // 537: "private_get_conditional_orders_history"
    // 538: "privateGetFills"
    // 539: "private_get_fills"
    // 540: "privateGetFundingPayments"
    // 541: "private_get_funding_payments"
    // 542: "privateGetLtBalances"
    // 543: "private_get_lt_balances"
    // 544: "privateGetLtCreations"
    // 545: "private_get_lt_creations"
    // 546: "privateGetLtRedemptions"
    // 547: "private_get_lt_redemptions"
    // 548: "privateGetSubaccounts"
    // 549: "private_get_subaccounts"
    // 550: "privateGetSubaccountsNicknameBalances"
    // 551: "private_get_subaccounts_nickname_balances"
    // 552: "privateGetOtcQuotesQuoteId"
    // 553: "private_get_otc_quotes_quoteid"
    // 554: "privateGetOptionsMyRequests"
    // 555: "private_get_options_my_requests"
    // 556: "privateGetOptionsRequestsRequestIdQuotes"
    // 557: "private_get_options_requests_request_id_quotes"
    // 558: "privateGetOptionsMyQuotes"
    // 559: "private_get_options_my_quotes"
    // 560: "privateGetOptionsAccountInfo"
    // 561: "private_get_options_account_info"
    // 562: "privateGetOptionsPositions"
    // 563: "private_get_options_positions"
    // 564: "privateGetOptionsFills"
    // 565: "private_get_options_fills"
    // 566: "privatePostAccountLeverage"
    // 567: "private_post_account_leverage"
    // 568: "privatePostWalletWithdrawals"
    // 569: "private_post_wallet_withdrawals"
    // 570: "privatePostOrders"
    // 571: "private_post_orders"
    // 572: "privatePostConditionalOrders"
    // 573: "private_post_conditional_orders"
    // 574: "privatePostOrdersOrderIdModify"
    // 575: "private_post_orders_order_id_modify"
    // 576: "privatePostOrdersByClientIdClientOrderIdModify"
    // 577: "private_post_orders_by_client_id_client_order_id_modify"
    // 578: "privatePostConditionalOrdersOrderIdModify"
    // 579: "private_post_conditional_orders_order_id_modify"
    // 580: "privatePostLtTokenNameCreate"
    // 581: "private_post_lt_token_name_create"
    // 582: "privatePostLtTokenNameRedeem"
    // 583: "private_post_lt_token_name_redeem"
    // 584: "privatePostSubaccounts"
    // 585: "private_post_subaccounts"
    // 586: "privatePostSubaccountsUpdateName"
    // 587: "private_post_subaccounts_update_name"
    // 588: "privatePostSubaccountsTransfer"
    // 589: "private_post_subaccounts_transfer"
    // 590: "privatePostOtcQuotesQuoteIdAccept"
    // 591: "private_post_otc_quotes_quote_id_accept"
    // 592: "privatePostOtcQuotes"
    // 593: "private_post_otc_quotes"
    // 594: "privatePostOptionsRequests"
    // 595: "private_post_options_requests"
    // 596: "privatePostOptionsRequestsRequestIdQuotes"
    // 597: "private_post_options_requests_request_id_quotes"
    // 598: "privatePostOptionsQuotesQuoteIdAccept"
    // 599: "private_post_options_quotes_quote_id_accept"
    // 600: "privateDeleteOrdersOrderId"
    // 601: "private_delete_orders_order_id"
    // 602: "privateDeleteOrdersByClientIdClientOrderId"
    // 603: "private_delete_orders_by_client_id_client_order_id"
    // 604: "privateDeleteOrders"
    // 605: "private_delete_orders"
    // 606: "privateDeleteConditionalOrdersOrderId"
    // 607: "private_delete_conditional_orders_order_id"
    // 608: "privateDeleteSubaccounts"
    // 609: "private_delete_subaccounts"
    // 610: "privateDeleteOptionsRequestsRequestId"
    // 611: "private_delete_options_requests_request_id"
    // 612: "privateDeleteOptionsQuotesQuoteId"
    // 613: "private_delete_options_quotes_quote_id"
    // 614: "tokenBucket"
    // 615: "executeRestRequest"
    baseLogger.info(Object.keys(this.ftx))
  }
}
