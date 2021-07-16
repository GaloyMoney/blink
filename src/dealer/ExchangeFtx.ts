import _ from "lodash"
import {
  FetchDepositAddressResult,
  WithdrawParameters,
  WithdrawResult,
  CreateOrderParameters,
  CreateOrderResult,
  FetchOrderResult,
  GetAccountAndPositionRiskResult,
  GetInstrumentDetailsResult,
  SupportedChain,
  TradeCurrency,
  TradeSide,
  ApiError,
  OrderStatus,
} from "./ExchangeTradingType"
import assert from "assert"
import { ApiConfig, ExchangeBase } from "./ExchangeBase"
import { Result } from "./Result"

export abstract class ExchangeFtx extends ExchangeBase {
  constructor(apiConfig: ApiConfig) {
    super(apiConfig)
  }

  public async fetchDepositAddress(
    currency: string,
  ): Promise<Result<FetchDepositAddressResult>> {
    try {
      assert(currency === TradeCurrency.BTC, ApiError.UNSUPPORTED_CURRENCY)

      const ftxResp = await this.exchange.fetchDepositAddress(currency)

      assert(ftxResp, ApiError.UNSUPPORTED_API_RESPONSE)
      assert(ftxResp.currency === TradeCurrency.BTC, ApiError.UNSUPPORTED_CURRENCY)
      assert(ftxResp.address, ApiError.UNSUPPORTED_ADDRESS)

      return {
        ok: true,
        value: {
          originalResponseAsIs: ftxResp,
          chain: SupportedChain.BTC_Bitcoin,
          currency: ftxResp.currency,
          address: ftxResp.address,
        },
      }
    } catch (error) {
      return { ok: false, error: error }
    }
  }

  public async withdraw(args: WithdrawParameters): Promise<Result<WithdrawResult>> {
    try {
      assert(args, ApiError.MISSING_PARAMETERS)
      assert(args.currency === TradeCurrency.BTC, ApiError.UNSUPPORTED_CURRENCY)
      assert(args.quantity > 0, ApiError.NON_POSITIVE_QUANTITY)
      assert(args.address, ApiError.UNSUPPORTED_ADDRESS)

      const ftxResp = await this.exchange.withdraw(
        args.currency,
        args.quantity,
        args.address,
      )

      assert(ftxResp, ApiError.UNSUPPORTED_API_RESPONSE)

      return {
        ok: true,
        value: {
          originalResponseAsIs: ftxResp,
          status: ftxResp.status,
        },
      }
    } catch (error) {
      return { ok: false, error: error }
    }
  }

  public async createMarketOrder(
    args: CreateOrderParameters,
  ): Promise<Result<CreateOrderResult>> {
    try {
      assert(args, ApiError.MISSING_PARAMETERS)
      assert(args.side !== TradeSide.NoTrade, ApiError.INVALID_TRADE_SIDE)
      assert(args.quantity > 0, ApiError.NON_POSITIVE_QUANTITY)

      const ftxResp = await this.exchange.createMarketOrder(args.side, args.quantity)

      assert(ftxResp, ApiError.UNSUPPORTED_API_RESPONSE)
      assert(ftxResp.id, ApiError.MISSING_ORDER_ID)

      return {
        ok: true,
        value: {
          originalResponseAsIs: ftxResp,
          id: ftxResp.id,
        },
      }
    } catch (error) {
      return { ok: false, error: error }
    }
  }

  public async fetchOrder(id: string): Promise<Result<FetchOrderResult>> {
    try {
      assert(id, ApiError.MISSING_PARAMETERS)

      // call api
      const ftxResp = await this.exchange.fetchOrder(id)

      assert(ftxResp, ApiError.UNSUPPORTED_API_RESPONSE)
      assert(ftxResp.status as OrderStatus, ApiError.UNSUPPORTED_API_RESPONSE)

      return {
        ok: true,
        value: {
          originalResponseAsIs: ftxResp,
          status: ftxResp.status,
        },
      }
    } catch (error) {
      return { ok: false, error: error }
    }
  }

  public async getAccountAndPositionRisk(
    btcPriceInUsd,
  ): Promise<Result<GetAccountAndPositionRiskResult>> {
    try {
      assert(btcPriceInUsd > 0, ApiError.MISSING_PARAMETERS)

      const ftxResp = await this.exchange.privateGetAccount()

      assert(ftxResp, ApiError.UNSUPPORTED_API_RESPONSE)

      const leverage = ftxResp.marginFraction
        ? 1 / ftxResp.marginFraction
        : Number.POSITIVE_INFINITY

      const { netSize = 0 } = _.find(ftxResp.positions, { future: this.symbol })

      const exposureInUsd = -netSize * btcPriceInUsd

      return {
        ok: true,
        value: {
          originalResponseAsIs: ftxResp,
          lastBtcPriceInUsd: btcPriceInUsd,
          leverageRatio: leverage,
          collateralInUsd: ftxResp.collateral,
          exposureInUsd: exposureInUsd,
          totalAccountValueInUsd: ftxResp.totalAccountValue,
        },
      }
    } catch (error) {
      return { ok: false, error: error }
    }
  }

  public async getInstrumentDetails(): Promise<Result<GetInstrumentDetailsResult>> {
    try {
      throw new Error(ApiError.NOT_IMPLEMENTED)

      // call api
      const ftxResp = await this.exchange.function()

      assert(ftxResp, ApiError.UNSUPPORTED_API_RESPONSE)

      return {
        ok: true,
        value: {
          originalResponseAsIs: ftxResp,
          minimumOrderSizeInContract: 0,
          contractFaceValue: 0,
        },
      }
    } catch (error) {
      return { ok: false, error: error }
    }
  }
}
