import { sleep } from "../utils"
import { yamlConfig } from "../config"
import { Result } from "./Result"
import {
  TradeSide,
  TradeType,
  OrderStatus,
  GetAccountAndPositionRiskResult,
} from "./ExchangeTradingType"
import { HedgingStrategy, UpdatedPosition, UpdatedBalance } from "./HedgingStrategyTypes"
import { SupportedExchange, ExchangeBase } from "./ExchangeBase"
import { ExchangeOkex } from "./ExchangeOkex"

const exchangeName = SupportedExchange.OKEX5
const strategySymbol = "BTC-USD-SWAP"

const hedgingBounds = yamlConfig.hedging

const isSimulation = !process.env["HEDGING_NOT_IN_SIMULATION"]
if (!isSimulation) {
  throw new Error(`Hedging active, please disable this safeguard.`)
}

export interface GetHedgingOrderResult {
  in: {
    exposureRatio
    loBracket
    hiBracket
  }
  out: {
    tradeSide
    orderSizeInUsd
    orderSizeInBtc
    btcPriceInUsd
  }
}

export interface GetRiskAndOrderResult {
  risk: GetAccountAndPositionRiskResult
  order: GetHedgingOrderResult
}

export class OkexPerpetualSwapStrategy implements HedgingStrategy {
  exchange: ExchangeBase
  symbol
  logger

  constructor(logger) {
    this.exchange = new ExchangeOkex(exchangeName, strategySymbol, logger)
    this.symbol = strategySymbol
    this.logger = logger.child({ class: OkexPerpetualSwapStrategy.name })
  }

  public async UpdatePosition(
    liabilityInUsd,
    btcPriceInUsd,
  ): Promise<Result<UpdatedPosition>> {
    try {
      const logger = this.logger.child({ method: "UpdatePosition()" })

      let naRisk
      const riskAndOrderResult = await this.getRiskAndOrder(
        btcPriceInUsd,
        liabilityInUsd,
        hedgingBounds,
      )
      logger.debug(
        { btcPriceInUsd, liabilityInUsd, hedgingBounds, riskAndOrderResult },
        "getRiskAndOrder({btcPriceInUsd}, {liabilityInUsd}, {hedgingBounds}) returned: {riskAndOrderResult}",
      )
      if (!riskAndOrderResult.ok) {
        return { ok: false, error: riskAndOrderResult.error }
      }
      const originalRisk = riskAndOrderResult.value.risk
      const hedgingOrder = riskAndOrderResult.value.order

      if (hedgingOrder.out.tradeSide === TradeSide.NoTrade) {
        const msg = `${hedgingOrder.in.loBracket} < ${hedgingOrder.in.exposureRatio} < ${hedgingOrder.in.hiBracket}`
        logger.debug(`Calculated no hedging is needed: ${msg}`)
        return {
          ok: true,
          value: { oldPosition: originalRisk, newPosition: naRisk },
        }
      }

      if (hedgingOrder.out.tradeSide !== TradeSide.NoTrade && isSimulation) {
        logger.debug({ hedgingOrder }, "Calculated a SIMULATED new hedging order")
        return {
          ok: true,
          value: { oldPosition: originalRisk, newPosition: naRisk },
        }
      }

      logger.debug({ hedgingOrder }, "Calculated a new hedging order")

      const placedOrderResult = await this.placeHedgingOrder(
        hedgingOrder.out.tradeSide,
        hedgingOrder.out.orderSizeInUsd,
      )
      if (!placedOrderResult.ok) {
        return { ok: false, error: placedOrderResult.error }
      }

      // Check that we don't need another order, i.e. "all is good"
      const confirmRiskAndOrderResult = await this.getRiskAndOrder(
        btcPriceInUsd,
        liabilityInUsd,
        hedgingBounds,
      )
      logger.debug(
        { btcPriceInUsd, liabilityInUsd, hedgingBounds, confirmRiskAndOrderResult },
        "getRiskAndOrder({btcPriceInUsd}, {liabilityInUsd}, {hedgingBounds}) returned: {confirmRiskAndOrderResult}",
      )
      if (!confirmRiskAndOrderResult.ok) {
        return { ok: false, error: confirmRiskAndOrderResult.error }
      }
      const updatedRisk = confirmRiskAndOrderResult.value.risk
      const confirmationOrder = confirmRiskAndOrderResult.value.order

      if (!isSimulation && confirmationOrder.out.tradeSide !== TradeSide.NoTrade) {
        return {
          ok: false,
          error: new Error(
            `New hedging order required immediately after one was executed: ${hedgingOrder} vs ${confirmationOrder}`,
          ),
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
      throw new Error(
        `Not Implemented! and now using: ${liabilityInUsd}, ${btcPriceInUsd}`,
      )

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

  static getHedgingOrderIfNeeded(
    liabilityInUsd,
    exposureInUsd,
    btcPriceInUsd,
    hedgingBounds,
  ): Result<GetHedgingOrderResult> {
    try {
      let orderSizeInUsd = 0
      let tradeSide: TradeSide = TradeSide.NoTrade
      const exposureRatio = liabilityInUsd / exposureInUsd

      if (exposureRatio < hedgingBounds.LOW_BOUND_RATIO_SHORTING) {
        const newExposureInUsd =
          liabilityInUsd * hedgingBounds.LOW_SAFEBOUND_RATIO_SHORTING
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
        ok: true,
        value: {
          in: {
            exposureRatio,
            loBracket: hedgingBounds.HIGH_BOUND_RATIO_SHORTING,
            hiBracket: hedgingBounds.LOW_BOUND_RATIO_SHORTING,
          },
          out: {
            tradeSide,
            orderSizeInUsd,
            orderSizeInBtc,
            btcPriceInUsd,
          },
        },
      }
    } catch (error) {
      return { ok: false, error: error }
    }
  }

  async getRiskAndOrder(
    btcPriceInUsd,
    liabilityInUsd,
    hedgingBounds,
  ): Promise<Result<GetRiskAndOrderResult>> {
    try {
      const riskResult = await this.exchange.getAccountAndPositionRisk(btcPriceInUsd)
      this.logger.debug(
        { btcPriceInUsd, riskResult },
        "getAccountAndPositionRisk({btcPriceInUsd}) returned: {riskResult}",
      )
      if (!riskResult.ok) {
        return { ok: false, error: riskResult.error }
      }
      const risk = riskResult.value
      const lastBtcPriceInUsd = risk.lastBtcPriceInUsd
      const exposureInUsd = risk.exposureInUsd

      const orderResult = OkexPerpetualSwapStrategy.getHedgingOrderIfNeeded(
        liabilityInUsd,
        exposureInUsd,
        lastBtcPriceInUsd,
        hedgingBounds,
      )
      this.logger.debug(
        { hedgingBounds, orderResult },
        `getHedgingOrderIfNeeded(${liabilityInUsd}, ${exposureInUsd}, ${lastBtcPriceInUsd}, {hedgingBounds}) returned: {orderResult}`,
      )
      if (!orderResult.ok) {
        return { ok: false, error: orderResult.error }
      }
      const order = orderResult.value

      return {
        ok: true,
        value: { risk, order },
      }
    } catch (error) {
      return { ok: false, error: error }
    }
  }

  async placeHedgingOrder(tradeSide, btcPriceInUsd): Promise<Result<null>> {
    const logger = this.logger.child({ method: "placeHedgingOrder()" })

    try {
      const result = await this.exchange.getInstrumentDetails()
      logger.debug({ result }, "getInstrumentDetails() returned: {result}")
      if (!result.ok) {
        return { ok: false, error: result.error }
      }
      const contractDetail = result.value

      const minOrderSizeInContract = contractDetail.minimumOrderSizeInContract
      const contractFaceValue = contractDetail.contractFaceValue
      const orderSizeInContract = Math.round(btcPriceInUsd / contractFaceValue)

      if (orderSizeInContract < minOrderSizeInContract) {
        const msg = `Order size (${orderSizeInContract}) is smaller than minimum (${minOrderSizeInContract}). Cannot place order`
        logger.warn(msg)
        return { ok: false, error: new Error(msg) }
      }

      const orderResult = await this.exchange.createMarketOrder({
        type: TradeType.Market,
        side: tradeSide,
        quantity: orderSizeInContract,
      })
      logger.debug(
        { orderResult },
        `this.exchange.createMarketOrder(${tradeSide}, ${orderSizeInContract}) returned: {orderResult}`,
      )
      if (!orderResult.ok) {
        return { ok: false, error: orderResult.error }
      }
      const placedOrder = orderResult.value

      const waitTimeInMs = 1000
      const maxWaitCycleCount = 30
      let iteration = 0
      let fetchedOrder

      do {
        await sleep(waitTimeInMs)
        const fetchedOrderResult = await this.exchange.fetchOrder(placedOrder.id)
        logger.debug(
          { fetchedOrderResult },
          `this.exchange.fetchOrder(${placedOrder.id}) returned: {fetchedOrderResult}`,
        )
        if (!fetchedOrderResult.ok) {
          return { ok: false, error: fetchedOrderResult.error }
        }
        fetchedOrder = fetchedOrderResult.value
      } while (
        ++iteration < maxWaitCycleCount &&
        fetchedOrder &&
        fetchedOrder.status === OrderStatus.Open
      )

      if (fetchedOrder.status === OrderStatus.Closed) {
        logger.info("Order has been place successfully.")
        return {
          ok: true,
          value: null,
        }
      } else if (fetchedOrder.status === OrderStatus.Canceled) {
        const msg = "Order has been cancelled."
        logger.error(msg)
        return { ok: false, error: new Error(msg) }
      } else {
        const msg = "Order has not been executed yet."
        logger.error(msg)
        return { ok: false, error: new Error(msg) }
      }
    } catch (error) {
      return { ok: false, error: error }
    }
  }
}
