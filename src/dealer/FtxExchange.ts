import _ from "lodash"
import {
  GetAccountAndPositionRiskResult,
  GetInstrumentDetailsResult,
  ApiError,
} from "./ExchangeTradingType"
import assert from "assert"
import { ExchangeBase } from "./ExchangeBase"
import { ExchangeConfiguration } from "./ExchangeConfiguration"
import { Result } from "./Result"

export class FtxExchange extends ExchangeBase {
  instrumentId

  constructor(exchangeConfiguration: ExchangeConfiguration, logger) {
    super(exchangeConfiguration, logger)
    this.instrumentId = exchangeConfiguration.instrumentId
  }

  public async getAccountAndPositionRisk(
    btcPriceInUsd,
  ): Promise<Result<GetAccountAndPositionRiskResult>> {
    try {
      assert(btcPriceInUsd > 0, ApiError.MISSING_PARAMETERS)

      const response = await this.exchange.privateGetAccount()
      this.logger.debug({ response }, "exchange.privateGetAccount() returned: {response}")

      assert(response, ApiError.UNSUPPORTED_API_RESPONSE)

      const leverage = response.marginFraction
        ? 1 / response.marginFraction
        : Number.POSITIVE_INFINITY

      const { netSize = 0 } = _.find(response.positions, { future: this.instrumentId })

      const exposureInUsd = -netSize * btcPriceInUsd

      return {
        ok: true,
        value: {
          originalResponseAsIs: response,
          lastBtcPriceInUsd: btcPriceInUsd,
          leverageRatio: leverage,
          collateralInUsd: response.collateral,
          exposureInUsd: exposureInUsd,
          totalAccountValueInUsd: response.totalAccountValue,
        },
      }
    } catch (error) {
      return { ok: false, error: error }
    }
  }

  public async getInstrumentDetails(): Promise<Result<GetInstrumentDetailsResult>> {
    return { ok: false, error: new Error(ApiError.NOT_IMPLEMENTED) }
  }
}
