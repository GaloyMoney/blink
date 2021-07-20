import {
  GetAccountAndPositionRiskResult,
  GetInstrumentDetailsResult,
  TradeCurrency,
  ApiError,
} from "./ExchangeTradingType"
import assert from "assert"
import { ExchangeBase } from "./ExchangeBase"
import { ExchangeConfiguration } from "./ExchangeConfiguration"
import { Result } from "./Result"

export class OkexExchange extends ExchangeBase {
  instrumentId

  constructor(exchangeConfiguration: ExchangeConfiguration, logger) {
    super(exchangeConfiguration, logger)
    this.instrumentId = exchangeConfiguration.instrumentId
  }

  public async getAccountAndPositionRisk(
    btcPriceInUsd,
  ): Promise<Result<GetAccountAndPositionRiskResult>> {
    try {
      // OKEx has last price as apart of position data, may forgo input validation
      assert(btcPriceInUsd > 0, ApiError.MISSING_PARAMETERS)

      const position = await this.exchange.fetchPosition(this.instrumentId)
      this.logger.debug(
        { position },
        `exchange.fetchPosition(${this.instrumentId}) returned: {position}`,
      )
      assert(position, ApiError.UNSUPPORTED_API_RESPONSE)
      assert(position.last >= 0, ApiError.NON_POSITIVE_PRICE)
      assert(position.notionalUsd >= 0, ApiError.NON_POSITIVE_NOTIONAL)
      assert(position.margin >= 0, ApiError.NON_POSITIVE_MARGIN)

      const lastBtcPriceInUsd = position.last
      const leverageRatio = position.notionalUsd / position.last / position.margin
      const collateralInUsd = position.margin * position.last
      const exposureInUsd = position.notionalUsd

      const balance = await this.exchange.fetchBalance()
      this.logger.debug({ balance }, "exchange.fetchBalance() returned: {balance}")
      assert(balance, ApiError.UNSUPPORTED_API_RESPONSE)
      assert(balance?.info?.data?.[0]?.totalEq, ApiError.MISSING_ACCOUNT_VALUE)
      assert(balance?.info?.data?.[0]?.totalEq >= 0, ApiError.NON_POSITIVE_ACCOUNT_VALUE)
      const totalAccountValueInUsd = balance?.info?.data?.[0]?.totalEq

      return {
        ok: true,
        value: {
          originalResponseAsIs: { positionResponse: position, balanceResponse: balance },
          lastBtcPriceInUsd: lastBtcPriceInUsd,
          leverageRatio: leverageRatio,
          collateralInUsd: collateralInUsd,
          exposureInUsd: exposureInUsd,
          totalAccountValueInUsd: totalAccountValueInUsd,
        },
      }
    } catch (error) {
      return { ok: false, error: error }
    }
  }

  public async getInstrumentDetails(): Promise<Result<GetInstrumentDetailsResult>> {
    try {
      const response = await this.exchange.publicGetPublicInstruments({
        instType: "SWAP",
        instId: this.instrumentId,
      })
      this.logger.debug(
        { response },
        `publicGetPublicInstruments(${this.instrumentId}) returned: {response}`,
      )
      assert(response, ApiError.UNSUPPORTED_API_RESPONSE)
      assert(response.ctValCcy === TradeCurrency.USD, ApiError.INVALID_TRADE_SIDE)
      assert(response.minSz > 0, ApiError.NON_POSITIVE_QUANTITY)
      assert(response.ctVal > 0, ApiError.NON_POSITIVE_PRICE)

      // const contractFaceValue = response.ctVal
      // const orderSizeInContract = Math.round(btcPriceInUsd / contractFaceValue)

      return {
        ok: true,
        value: {
          originalResponseAsIs: response,
          minimumOrderSizeInContract: response.minSz,
          contractFaceValue: response.ctVal,
        },
      }
    } catch (error) {
      return { ok: false, error: error }
    }
  }
}
