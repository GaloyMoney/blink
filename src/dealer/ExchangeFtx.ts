import _ from "lodash"
import {
  WithdrawParameters,
  CreateOrderParameters,
  GetAccountAndPositionRiskResult,
  GetInstrumentDetailsResult,
  TradeCurrency,
  TradeSide,
  ApiError,
  OrderStatus,
  SupportedChain,
  FetchDepositAddressResult,
} from "./ExchangeTradingType"
import assert from "assert"
import { ExchangeBase, SupportedExchange } from "./ExchangeBase"
import { Result } from "./Result"

export class ExchangeFtx extends ExchangeBase {
  symbol

  constructor(exchangeId: SupportedExchange, strategySymbol: string, logger) {
    super(exchangeId, logger)
    this.symbol = strategySymbol
  }

  fetchDepositAddressValidateInput(currency: string) {
    assert(currency === TradeCurrency.BTC, ApiError.UNSUPPORTED_CURRENCY)
  }
  fetchDepositAddressProcessApiResponse(response): FetchDepositAddressResult {
    assert(response, ApiError.UNSUPPORTED_API_RESPONSE)
    assert(response.currency === TradeCurrency.BTC, ApiError.UNSUPPORTED_CURRENCY)
    assert(response.address, ApiError.UNSUPPORTED_ADDRESS)
    return {
      originalResponseAsIs: response,
      chain: SupportedChain.BTC_Bitcoin,
      currency: response.currency,
      address: response.address,
    }
  }

  withdrawValidateInput(args: WithdrawParameters) {
    assert(args, ApiError.MISSING_PARAMETERS)
    assert(args.currency === TradeCurrency.BTC, ApiError.UNSUPPORTED_CURRENCY)
    assert(args.quantity > 0, ApiError.NON_POSITIVE_QUANTITY)
    assert(args.address, ApiError.UNSUPPORTED_ADDRESS)
  }
  withdrawValidateApiResponse(response) {
    assert(response, ApiError.UNSUPPORTED_API_RESPONSE)
    // assert(response.status) // we don't know enough to validate the status, TODO
  }

  createMarketOrderValidateInput(args: CreateOrderParameters) {
    assert(args, ApiError.MISSING_PARAMETERS)
    assert(args.side !== TradeSide.NoTrade, ApiError.INVALID_TRADE_SIDE)
    assert(args.quantity > 0, ApiError.NON_POSITIVE_QUANTITY)
  }
  createMarketOrderValidateApiResponse(response) {
    assert(response, ApiError.UNSUPPORTED_API_RESPONSE)
    assert(response.id, ApiError.MISSING_ORDER_ID)
  }

  fetchOrderValidateInput(id: string) {
    assert(id, ApiError.MISSING_PARAMETERS)
  }
  fetchOrderValidateApiResponse(response) {
    assert(response, ApiError.UNSUPPORTED_API_RESPONSE)
    assert(response.status as OrderStatus, ApiError.UNSUPPORTED_API_RESPONSE)
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

      const { netSize = 0 } = _.find(response.positions, { future: this.symbol })

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
