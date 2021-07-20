import { sleep } from "../utils"
import _ from "lodash"
import { yamlConfig } from "../config"
import { TradeSide, FundTransferSide } from "./ExchangeTradingType"
import assert from "assert"
import { Result } from "./Result"
import { HedgingStrategy, UpdatedPosition, UpdatedBalance } from "./HedgingStrategyTypes"
import { ExchangeBase } from "./ExchangeBase"
import { ExchangeConfigurationFtx } from "./ExchangeConfigurationFtx"
import { ExchangeFtx } from "./ExchangeFtx"

const hedgingBounds = yamlConfig.hedging

const isSimulation = !process.env["HEDGING_NOT_IN_SIMULATION"]
if (!isSimulation) {
  throw new Error(`Hedging active, please disable this safeguard.`)
}

export class FtxPerpetualSwapStrategy implements HedgingStrategy {
  exchange: ExchangeBase
  instrumentId
  logger

  constructor(logger) {
    const exchangeConfig = new ExchangeConfigurationFtx()
    this.exchange = new ExchangeFtx(exchangeConfig, logger)
    this.instrumentId = exchangeConfig.instrumentId
    this.logger = logger.child({ class: FtxPerpetualSwapStrategy.name })
  }

  public async UpdatePosition(
    usdLiability,
    btcPriceInUsd,
  ): Promise<Result<UpdatedPosition>> {
    try {
      //   const { usd: usdLiability } = await this.getLocalLiabilities()
      const {
        usd: usdExposure,
        leverage,
        collateral,
      } = await this.getAccountPosition(btcPriceInUsd)

      const subLogger = this.logger.child({
        usdExposure,
        usdLiability,
        leverage,
        collateral,
        btcPriceInUsd,
      })

      const { btcAmount, buyOrSell } = FtxPerpetualSwapStrategy.isOrderNeeded({
        usdLiability,
        usdExposure,
        btcPriceInUsd,
        hedgingBounds,
      })
      subLogger.debug({ btcAmount, buyOrSell }, "isOrderNeeded result")

      // TODO fix this simulation flag so it's only at the API call location
      if (buyOrSell && !isSimulation) {
        await this.executeOrder({ btcAmount, buyOrSell })

        // const { usd: usdLiability } = await this.getLocalLiabilities()
        const { usd: updatedUsdExposure } = await this.getAccountPosition(btcPriceInUsd)

        subLogger.debug(
          {
            updatedUsdLiability: usdLiability,
            updatedUsdExposure,
            btcPriceInUsd,
          },
          "input for the updated isOrderNeeded after an order",
        )
        const { buyOrSell: newBuyOrSell } = FtxPerpetualSwapStrategy.isOrderNeeded({
          usdLiability,
          usdExposure: updatedUsdExposure,
          btcPriceInUsd,
          hedgingBounds,
        })

        subLogger.debug(
          { newBuyOrSell },
          "output for the updated isOrderNeeded after an order",
        )
        assert(!newBuyOrSell)
      }

      // TODO: fill in the right stuff
      return {
        ok: true,
        value: {
          originalPosition: {
            leverageRatio: 0,
            collateralInUsd: 0,
            exposureInUsd: 0,
            totalAccountValueInUsd: 0,
          },
          newPosition: {
            leverageRatio: 0,
            collateralInUsd: 0,
            exposureInUsd: 0,
            totalAccountValueInUsd: 0,
          },
        },
      }
    } catch (error) {
      return { ok: false, error: error }
    }
  }

  public async UpdateLeverage(
    usdLiability,
    btcPriceInUsd,
  ): Promise<Result<UpdatedBalance>> {
    try {
      const updatedBalance = {} as UpdatedBalance
      //   const { usd: usdLiability } = await this.getLocalLiabilities()
      const {
        usd: usdExposure,
        leverage,
        collateral,
      } = await this.getAccountPosition(btcPriceInUsd)

      const subLogger = this.logger.child({
        usdExposure,
        usdLiability,
        leverage,
        collateral,
        btcPriceInUsd,
      })

      const { btcAmount, depositOrWithdraw } = FtxPerpetualSwapStrategy.isRebalanceNeeded(
        {
          usdLiability,
          btcPriceInUsd,
          usdCollateral: collateral,
          hedgingBounds,
        },
      )
      subLogger.debug({ btcAmount, depositOrWithdraw }, "isRebalanceNeeded result")

      // TODO: figure out how
      //   if (!simulateOnly) {
      //     await this.rebalance({ btcAmount, depositOrWithdraw, logger: subLogger })
      //   }

      // TODO: add a check that rebalancing is no longer needed.
      // maybe with the block time, this is not as easy?

      // TODO: fill in the right stuff
      return {
        ok: true,
        value: updatedBalance,
      }
    } catch (error) {
      return { ok: false, error: error }
    }
  }

  async getAccountPosition(btcPriceInUsd) {
    this.logger.debug({ btcPriceInUsd }, "[DEBUG] is price set for the dealer?")

    // TODO: what is being returned if no order had been placed?
    // probably an empty array

    // tmp for log
    const result = await this.exchange.bypass.privateGetAccount()
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

    const positionBtcPerp = _.find(positions, { future: this.instrumentId })
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

      usd: -netSize * btcPriceInUsd,
      estimatedLiquidationPrice,
      collateralUsed, // USD
      maintenanceMarginRequirement, // start at 0.03 but increase with position side

      collateral, // in USD

      totalAccountValue,

      // if there is no collateral, marginFraction will be null. this is equivalent to infinite leverage.
      leverage: marginFraction ? 1 / marginFraction : Number.POSITIVE_INFINITY,
    }
  }

  static isOrderNeeded({ usdLiability, usdExposure, btcPriceInUsd, hedgingBounds }) {
    const ratio = usdExposure / usdLiability

    let usdOrderAmount
    let buyOrSell: TradeSide = TradeSide.NoTrade

    try {
      // long (exposed to change in price in BTC)
      // will loose money if BTCUSD price drops
      if (ratio < hedgingBounds.LOW_BOUND_RATIO_SHORTING) {
        const targetUsd = usdLiability * hedgingBounds.LOW_SAFEBOUND_RATIO_SHORTING
        usdOrderAmount = targetUsd - usdExposure
        buyOrSell = TradeSide.Sell
      }

      // short (exposed to change in price in BTC)
      // will loose money if BTCUSD price increase
      else if (ratio > hedgingBounds.HIGH_BOUND_RATIO_SHORTING) {
        const targetUsd = usdLiability * hedgingBounds.HIGH_SAFEBOUND_RATIO_SHORTING
        usdOrderAmount = usdExposure - targetUsd
        buyOrSell = TradeSide.Buy
      }

      // else:
      // we have no, or next to none, exposure to change in price in BTC
    } catch (err) {
      throw Error("can't calculate hedging value")
    }

    const btcAmount = usdOrderAmount / btcPriceInUsd

    if (buyOrSell) {
      assert(btcAmount >= 0)
      // assert(usdOrderAmount < usdLiability)
      // TODO: should be reduce only
    }

    return { btcAmount, buyOrSell }
  }

  async executeOrder({ buyOrSell, btcAmount }) {
    let order, orderStatus

    // let orderId = 6103637365
    // let orderId

    // TODO: limit order
    const orderType = "market"

    const logOrder = this.logger.child({
      symbol: this.instrumentId,
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
      order = await this.exchange.bypass.createOrder(
        this.instrumentId,
        orderType,
        buyOrSell,
        btcAmount,
      )
    } catch (err) {
      logOrder.error({ err }, "error placing an order")
      throw err
    }

    // FIXME: have a better way to manage latency
    // ie: use a while loop and check condition for a couple of seconds.
    // or rely on a websocket
    await sleep(5000)

    try {
      orderStatus = await this.exchange.bypass.fetchOrder(order.id)
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

  static isRebalanceNeeded({
    usdLiability,
    btcPriceInUsd,
    usdCollateral,
    hedgingBounds,
  }) {
    let usdAmountDiff
    let depositOrWithdraw = FundTransferSide.NoTransfer

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
    if (leverage < hedgingBounds.LOW_BOUND_LEVERAGE) {
      const targetUsdCollateral = usdLiability / hedgingBounds.LOW_SAFEBOUND_LEVERAGE
      usdAmountDiff = usdCollateral - targetUsdCollateral
      depositOrWithdraw = FundTransferSide.Withdraw
    }

    // over leveraged
    // our collateral could get liquidated if we don't rebalance
    else if (leverage > hedgingBounds.HIGH_BOUND_LEVERAGE) {
      const targetUsdCollateral = usdLiability / hedgingBounds.HIGH_SAFEBOUND_LEVERAGE
      usdAmountDiff = targetUsdCollateral - usdCollateral
      depositOrWithdraw = FundTransferSide.Deposit
    }

    const btcAmount = usdAmountDiff / btcPriceInUsd

    if (depositOrWithdraw) {
      assert(btcAmount > 0)
      // amount more than 3x of collateral should not happen
      // although it could happen the first time the dealer is launched?
      assert(btcAmount < 3 * (usdLiability / btcPriceInUsd))
    }

    return { btcAmount, depositOrWithdraw }
  }
}
