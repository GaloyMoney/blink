import { sleep } from "../utils"
import _ from "lodash"
import { yamlConfig } from "../config"
import { TradeSide, FundTransferSide, Currency, OrderStatus } from "./IExchange"
import ccxt, { Order } from "ccxt"
import { Result } from "./Result"
import { IHedgingStrategy, UpdatedPosition, UpdatedBalance } from "./IHedgingStrategy"

const exchangeName = "OKEX"
const exchangeSwapSymbol = "BTC-USD-SWAP"

const apiKey = process.env[`${exchangeName}_KEY`]
const secret = process.env[`${exchangeName}_SECRET`]
const password = process.env[`${exchangeName}_PASSWORD`]

const simulateOnly = !process.env["HEDGING_NOT_IN_SIMULATION"]

if (!simulateOnly) {
  throw new Error(`Hedging active, please disable this safeguard.`)
}

const hedgingBounds = yamlConfig.hedging

export class OkexPerpetualSwapStrategy implements IHedgingStrategy {
  exchange
  symbol
  logger

  constructor(logger) {
    this.exchange = new ccxt.okex5({ apiKey, secret, password })
    // The following check throws if something is wrong
    this.exchange.checkRequiredCredentials()
    this.symbol = exchangeSwapSymbol
    this.logger = logger.child({ class: OkexPerpetualSwapStrategy.name })
  }

  public async UpdatePosition(
    liabilityInUsd,
    btcPriceInUsd,
  ): Promise<Result<UpdatedPosition>> {
    try {
      const logger = this.logger.child({ method: "UpdatePosition()" })

      let lastBtcPriceInUsd = 0
      let exposureInUsd = 0

      let updatedRisk
      const originalRisk = await this.getAccountRiskMeasures()
      logger.debug({ called: "getAccountRiskMeasures()", returned: originalRisk })

      if (originalRisk) {
        lastBtcPriceInUsd = originalRisk.lastBtcPriceInUsd
        exposureInUsd = originalRisk.exposureInUsd
      }

      const hedgingOrder = OkexPerpetualSwapStrategy.getHedgingOrderIfNeeded(
        liabilityInUsd,
        exposureInUsd,
        lastBtcPriceInUsd,
        hedgingBounds,
      )
      logger.debug({
        called: `getHedgingOrderIfNeeded(${liabilityInUsd}, ${exposureInUsd}, ${lastBtcPriceInUsd}, hedgingBounds)`,
        hedgingBounds: hedgingBounds,
        returned: hedgingOrder,
      })

      if (hedgingOrder.output.tradeSide === TradeSide.NoTrade) {
        const msg = `${hedgingOrder.input.loBracket} < ${hedgingOrder.input.exposureRatio} < ${hedgingOrder.input.hiBracket}`
        logger.debug(`Calculated no hedging is needed: ${msg}`)
      } else {
        if (hedgingOrder.output.IsSimulation) {
          logger.debug({
            msg: "Calculated a SIMULATED new hedging order",
            order: hedgingOrder,
          })
        } else {
          logger.debug({ msg: "Calculated a new hedging order", order: hedgingOrder })
          const result = await this.placeHedgingOrder(
            hedgingOrder.output.tradeSide,
            hedgingOrder.output.orderSizeInUsd,
          )
          if (result.ok) {
            // Check that we don't need another order, i.e. "all is good"
            updatedRisk = await this.getAccountRiskMeasures()
            logger.debug({ called: "getAccountRiskMeasures()", returned: updatedRisk })
            if (updatedRisk) {
              lastBtcPriceInUsd = updatedRisk.lastBtcPriceInUsd
              exposureInUsd = updatedRisk.exposureInUsd
            }

            const confirmationOrder = OkexPerpetualSwapStrategy.getHedgingOrderIfNeeded(
              liabilityInUsd,
              exposureInUsd,
              lastBtcPriceInUsd,
              hedgingBounds,
            )
            logger.debug({
              called: `getHedgingOrderIfNeeded(${liabilityInUsd}, ${exposureInUsd}, ${lastBtcPriceInUsd}, hedgingBounds)`,
              hedgingBounds: hedgingBounds,
              returned: confirmationOrder,
            })

            if (
              !confirmationOrder.output.IsSimulation &&
              confirmationOrder.output.tradeSide !== TradeSide.NoTrade
            ) {
              return {
                ok: false,
                error: new Error(
                  `New hedging order required immediately after one was executed: ${hedgingOrder} vs ${confirmationOrder}`,
                ),
              }
            }
          } else {
            return { ok: false, error: result.error }
          }
        }
      }
      return {
        ok: true,
        value: {
          oldPosition: originalRisk,
          newPosition: updatedRisk,
        },
      }
    } catch (error) {
      return { ok: false, error: error }
    }
  }

  public async UpdateLeverage(
    liabilityInUsd,
    btcPriceInUsd,
  ): Promise<Result<UpdatedBalance>> {
    try {

// Withdraw


      return {
        ok: true,
        value: {
          oldBalance: {
            leverageRatio: 0,
            collateralInUsd: 0,
            exposureInUsd: 0,
            totalAccountValueInUsd: 0,
          },
          newBalance: {
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

  async getAccountRiskMeasures() {
    const logger = this.logger.child({ method: "getAccountRiskMeasures()" })

    let lastBtcPriceInUsd = 0
    let leverageRatio = 0
    let collateralInUsd = 0
    let exposureInUsd = 0
    let totalAccountValueInUsd = 0

    const position = await this.exchange.fetchPosition(this.symbol)
    if (position) {
      lastBtcPriceInUsd = position.last
      leverageRatio = position.notionalUsd / position.last / position.margin
      collateralInUsd = position.margin * position.last
      exposureInUsd = position.notionalUsd
    }
    logger.debug({ called: `exchange.fetchPosition(${this.symbol})`, returned: position })

    const balance = await this.exchange.fetchBalance()
    if (balance) {
      totalAccountValueInUsd = balance?.info?.data?.[0]?.totalEq
    }
    logger.debug({ called: "exchange.fetchBalance()", returned: balance })

    return {
      lastBtcPriceInUsd,
      leverageRatio,
      collateralInUsd,
      exposureInUsd,
      totalAccountValueInUsd,
    }
  }

  static getHedgingOrderIfNeeded(
    liabilityInUsd,
    exposureInUsd,
    btcPriceInUsd,
    hedgingBounds,
  ) {
    let orderSizeInUsd = 0
    let tradeSide: TradeSide = TradeSide.NoTrade
    const exposureRatio = liabilityInUsd / exposureInUsd

    if (exposureRatio < hedgingBounds.LOW_BOUND_RATIO_SHORTING) {
      const newExposureInUsd = liabilityInUsd * hedgingBounds.LOW_SAFEBOUND_RATIO_SHORTING
      orderSizeInUsd = newExposureInUsd - exposureInUsd
      tradeSide = TradeSide.Sell
    } else if (exposureRatio > hedgingBounds.HIGH_BOUND_RATIO_SHORTING) {
      const newExposureInUsd =
        liabilityInUsd * hedgingBounds.HIGH_SAFEBOUND_RATIO_SHORTING
      orderSizeInUsd = exposureInUsd - newExposureInUsd
      tradeSide = TradeSide.Buy
    }

    const orderSizeInBtc = orderSizeInUsd / btcPriceInUsd
    return {
      input: {
        exposureRatio,
        loBracket: hedgingBounds.HIGH_BOUND_RATIO_SHORTING,
        hiBracket: hedgingBounds.LOW_BOUND_RATIO_SHORTING,
      },
      output: {
        tradeSide,
        orderSizeInUsd,
        orderSizeInBtc,
        btcPriceInUsd,
        IsSimulation: simulateOnly,
      },
    }
  }

  async placeHedgingOrder(tradeSide, btcPriceInUsd): Promise<Result<Order>> {
    const logger = this.logger.child({ method: "placeHedgingOrder()" })

    try {
      const swapContractDetail = await this.exchange.publicGetPublicInstruments({
        instType: "SWAP",
        instId: this.symbol,
      })

      logger.debug(
        `publicGetPublicInstruments(${this.symbol}) returned: ${swapContractDetail}`,
      )

      if (swapContractDetail && swapContractDetail?.ctValCcy === Currency.USD) {
        const minOrderSizeInContract = swapContractDetail?.minSz
        const contractFaceValue = swapContractDetail?.ctVal
        const orderSizeInContract = Math.round(btcPriceInUsd / contractFaceValue)

        if (orderSizeInContract >= minOrderSizeInContract) {
          const placedOrder = await this.exchange.createMarketOrder(
            this.symbol,
            tradeSide,
            orderSizeInContract,
          )

          logger.debug({
            called: `this.exchange.createMarketOrder(${tradeSide}, ${orderSizeInContract})`,
            returned: placedOrder,
          })

          const waitTimeInMs = 1000
          const maxWaitCycleCount = 30
          let iteration = 0
          let fetchedOrder

          do {
            await sleep(waitTimeInMs)
            fetchedOrder = await this.exchange.fetchOrder(placedOrder.id)
            logger.debug({
              called: `this.exchange.fetchOrder(${placedOrder.id})`,
              returned: fetchedOrder,
            })
          } while (
            ++iteration < maxWaitCycleCount &&
            fetchedOrder &&
            fetchedOrder.status === OrderStatus.Open
          )

          if (fetchedOrder?.status === OrderStatus.Closed) {
            logger.info("Order has been place successfully.")
            return {
              ok: true,
              value: fetchedOrder,
            }
          } else if (fetchedOrder?.status === OrderStatus.Canceled) {
            const msg = "Order has been cancelled."
            logger.error(msg)
            return { ok: false, error: new Error(msg) }
          } else {
            const msg = "Order has not been executed yet."
            logger.error(msg)
            return { ok: false, error: new Error(msg) }
          }
        } else {
          const msg = `Order size (${orderSizeInContract}) is smaller than minimum (${minOrderSizeInContract}). Cannot place order`
          logger.warn(msg)
          return { ok: false, error: new Error(msg) }
        }
      } else {
        const msg = "Unexpected contract details. Cannot place order"
        logger.error(msg)
        return { ok: false, error: new Error(msg) }
      }
    } catch (error) {
      return { ok: false, error: error }
    }
  }
}
