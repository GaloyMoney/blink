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

export abstract class ExchangeOkex extends ExchangeBase {
  constructor(apiConfig: ApiConfig) {
    super(apiConfig)
  }

  public async fetchDepositAddress(
    currency: string,
  ): Promise<Result<FetchDepositAddressResult>> {
    try {
      assert(currency === TradeCurrency.BTC, ApiError.UNSUPPORTED_CURRENCY)

      const okexResp = await this.exchange.fetchDepositAddress(currency)

      assert(okexResp, ApiError.UNSUPPORTED_API_RESPONSE)
      const { ccy, addr, chain } = _.find(okexResp.data, {
        chain: SupportedChain.BTC_Bitcoin,
      })
      assert(ccy === TradeCurrency.BTC, ApiError.UNSUPPORTED_CURRENCY)
      assert(addr, ApiError.UNSUPPORTED_ADDRESS)
      assert(chain === SupportedChain.BTC_Bitcoin, ApiError.UNSUPPORTED_CURRENCY)

      return {
        ok: true,
        value: {
          originalResponseAsIs: okexResp,
          chain: chain,
          currency: ccy,
          address: addr,
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

      const okexResp = await this.exchange.withdraw(
        args.currency,
        args.quantity,
        args.address,
      )

      assert(okexResp, ApiError.UNSUPPORTED_API_RESPONSE)

      return {
        ok: true,
        value: {
          originalResponseAsIs: okexResp,
          status: okexResp.status,
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

      const okexResp = await this.exchange.createMarketOrder(args.side, args.quantity)

      assert(okexResp, ApiError.UNSUPPORTED_API_RESPONSE)
      assert(okexResp.id, ApiError.MISSING_ORDER_ID)

      return {
        ok: true,
        value: {
          originalResponseAsIs: okexResp,
          id: okexResp.id,
        },
      }
    } catch (error) {
      return { ok: false, error: error }
    }
  }

  public async fetchOrder(id: string): Promise<Result<FetchOrderResult>> {
    try {
      assert(id, ApiError.MISSING_PARAMETERS)

      const okexResp = await this.exchange.fetchOrder(id)

      assert(okexResp, ApiError.UNSUPPORTED_API_RESPONSE)
      assert(okexResp.status as OrderStatus, ApiError.UNSUPPORTED_API_RESPONSE)

      return {
        ok: true,
        value: {
          originalResponseAsIs: okexResp,
          status: okexResp.status,
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

      const okexResp = await this.exchange.fetchPosition()
      const okexResp2 = await this.exchange.fetchBalance()

      const lastBtcPriceInUsd = 0
      const leverageRatio = 0
      const collateralInUsd = 0
      const exposureInUsd = 0
      const totalAccountValueInUsd = 0
      //   const position = await this.exchange.fetchPosition(this.symbol)
      //   if (position) {
      //     lastBtcPriceInUsd = position.last
      //     leverageRatio = position.notionalUsd / position.last / position.margin
      //     collateralInUsd = position.margin * position.last
      //     exposureInUsd = position.notionalUsd
      //   }
      //   logger.debug(
      //     { position },
      //     `exchange.fetchPosition(${this.symbol}) returned: {position}`,
      //   )

      //   const balance = await this.exchange.fetchBalance()
      //   if (balance) {
      //     totalAccountValueInUsd = balance?.info?.data?.[0]?.totalEq
      //   }
      //   logger.debug({ balance }, "exchange.fetchBalance() returned: {balance}")

      assert(okexResp, ApiError.UNSUPPORTED_API_RESPONSE)

      return {
        ok: true,
        value: {
          originalResponseAsIs: { fetchPosition: okexResp, fetchBalance: okexResp2 },
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
      const okexResp = await this.exchange.publicGetPublicInstruments()

      //   const swapContractDetail = await this.exchange.publicGetPublicInstruments({
      //     instType: "SWAP",
      //     instId: this.symbol,
      //   })

      //   if (swapContractDetail && swapContractDetail?.ctValCcy === TradeCurrency.USD) {
      //     const minOrderSizeInContract = swapContractDetail?.minSz
      //     const contractFaceValue = swapContractDetail?.ctVal
      //     const orderSizeInContract = Math.round(btcPriceInUsd / contractFaceValue)

      assert(okexResp, ApiError.UNSUPPORTED_API_RESPONSE)

      return {
        ok: true,
        value: {
          originalResponseAsIs: okexResp,
          minimumOrderSizeInContract: 0,
          contractFaceValue: 0,
        },
      }
    } catch (error) {
      return { ok: false, error: error }
    }
  }
}
