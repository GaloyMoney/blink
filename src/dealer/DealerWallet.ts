import _ from "lodash"
import { yamlConfig } from "../config"
import { accountDealerFtxPath, liabilitiesDealerFtxPath } from "../ledger/ledger"
import { MainBook } from "../mongodb"
import { OnChainMixin } from "../OnChain"
import { ILightningWalletUser } from "../types"
import { btc2sat, sleep } from "../utils"
import { baseLogger } from "../logger"
import { UserWallet } from "../userWallet"
import assert from "assert"

import { GenericExchange, SupportedExchanges, ApiConfig } from "./GenericExchange"

const activeExchangeId: SupportedExchanges = "ftx"

const key = process.env[`${activeExchangeId.toUpperCase()}_KEY`]
const secret = process.env[`${activeExchangeId.toUpperCase()}_SECRET`]
const password = process.env[`${activeExchangeId.toUpperCase()}_PASSWORD`]

if (!key || !secret || !password) {
  throw new Error(`Missing ${activeExchangeId} exchange environment variables`)
}

const activeApiConfig = new ApiConfig(activeExchangeId, key, secret, password)

// TODO: move to the yaml config
const simulateOnly = true

export type IBuyOrSell = "sell" | "buy" | null

// Dealer is a user of the wallet, therefore we are inheriting from UserWallet
// Dealer is interacting with Ftx through bitcoin layer 1,
// so it is using the OnChain Mixin.
export class DealerWallet extends OnChainMixin(UserWallet) {
  exchange

  constructor({ user, logger }: ILightningWalletUser) {
    super({ user, logger })
    this.exchange = new GenericExchange(activeApiConfig)
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
    return this.exchange.has()
  }

  async createDepositAddress() {
    // create a new address
    // is not enabled on FTX
    // return this.exchange.createDepositAddress("BTC")
    return Error("not implemented")
  }

  async exchangeDepositAddress() {
    // same address is returned each time
    const { address } = await this.exchange.fetchDepositAddress("BTC")
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
    const balance = await this.exchange.fetchBalance()
    this.logger.debug({ balance }, "this.exchange.fetchBalance result")
    return {
      sats: btc2sat(balance.total.BTC ?? 0),
      usdPnl: balance.total.USD,
    }
  }

  async getNextFundingRate() {
    const {
      result: { nextFundingRate },
    } = await this.exchange.getNextFundingRate()
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
    const result = await this.exchange.privateGetAccount()
    this.logger.debug({ result }, "full result of this.exchange.privateGetAccount")

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
      "value kept from this.exchange.privateGetAccount",
    )

    // getPositions() instead ?!?
    const positionBtcPerp = _.find(positions, { future: this.exchange.symbol })
    this.logger.debug({ positionBtcPerp }, "positionBtcPerp result")

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
      const memo = `withdrawal of ${btcAmount} btc from ${this.exchange.name()}`

      // TODO: manage the case of
      // "Account needs to have positive USD balances"

      // getLastOnChainAddress() could be used with whitelisting for more security
      const address = await this.getLastOnChainAddress()

      // TODO: need a withdrawal password?
      // FIXME: No fees? event the on-chain fees?

      let withdrawalResult

      subLogger = subLogger.child({ memo, address })

      try {
        withdrawalResult = await this.exchange.withdraw(currency, btcAmount, address)
      } catch (err) {
        const error = "this.exchange.withdraw() error issue"
        subLogger.error({ withdrawalResult }, error)
        throw new Error(err)
      }

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
        subLogger.error({ withdrawalResult }, `rebalancing withdrawal was not succesful`)
      }
    } else if (depositOrWithdraw === "deposit") {
      const memo = `deposit of ${btcAmount} btc to ${this.exchange.name()}`
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

    const logOrder = this.logger.child({
      symbol: this.exchange.symbol,
      orderType,
      buyOrSell,
      btcAmount,
    })

    // TODO: min order size could be dynamically fetched from
    // https://docs.ftx.com/#get-future
    const minOrderSize = 0.0001

    if (btcAmount < minOrderSize) {
      logOrder.info({ minOrderSize }, "order amount is too small, skipping order")
    }

    // TODO:
    // buy should be "reduceOnly":true

    try {
      order = await this.exchange.createOrder(orderType, buyOrSell, btcAmount)
    } catch (err) {
      logOrder.error({ err }, "error placing an order")
      throw err
    }

    // FIXME: have a better way to manage latency
    // ie: use a while loop and check condition for a couple of seconds.
    // or rely on a websocket
    await sleep(5000)

    try {
      orderStatus = await this.exchange.fetchOrder(order.id)
    } catch (err) {
      logOrder.error({ err }, "error fetching order status")
      throw err
    }

    if (orderStatus.status !== "closed") {
      logOrder.error({ order, orderStatus }, "market order has not been fullfilled")
      // Pager
    } else {
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

      const { btcAmount, buyOrSell } = DealerWallet.isOrderNeeded({
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
        const { buyOrSell: newBuyOrSell } = DealerWallet.isOrderNeeded({
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

      const { btcAmount, depositOrWithdraw } = DealerWallet.isRebalanceNeeded({
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
    baseLogger.info(this.exchange.getMethods())
  }
}
