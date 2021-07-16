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
import { ExchangeBase, SupportedExchange } from "./ExchangeBase"
import { Result } from "./Result"

export class ExchangeOkex extends ExchangeBase {
  constructor(exchangeId: SupportedExchange, strategySymbol: string, logger) {
    super(exchangeId, strategySymbol, logger)
  }

  fetchDepositAddressValidateInput(currency: string) {
    assert(currency === TradeCurrency.BTC, ApiError.UNSUPPORTED_CURRENCY)
  }
  fetchDepositAddressProcessApiResponse(response): FetchDepositAddressResult {
    assert(response, ApiError.UNSUPPORTED_API_RESPONSE)
    const { ccy, addr, chain } = _.find(response.data, {
      chain: SupportedChain.BTC_Bitcoin,
    })
    assert(ccy === TradeCurrency.BTC, ApiError.UNSUPPORTED_CURRENCY)
    assert(addr, ApiError.UNSUPPORTED_ADDRESS)
    assert(chain === SupportedChain.BTC_Bitcoin, ApiError.UNSUPPORTED_CURRENCY)
    return {
      originalResponseAsIs: response,
      chain: chain,
      currency: ccy,
      address: addr,
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

      const response = await this.exchange.fetchPosition()
      const response2 = await this.exchange.fetchBalance()

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

      assert(response, ApiError.UNSUPPORTED_API_RESPONSE)

      return {
        ok: true,
        value: {
          originalResponseAsIs: { fetchPosition: response, fetchBalance: response2 },
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
      const response = await this.exchange.publicGetPublicInstruments()

      //   const swapContractDetail = await this.exchange.publicGetPublicInstruments({
      //     instType: "SWAP",
      //     instId: this.symbol,
      //   })

      //   if (swapContractDetail && swapContractDetail?.ctValCcy === TradeCurrency.USD) {
      //     const minOrderSizeInContract = swapContractDetail?.minSz
      //     const contractFaceValue = swapContractDetail?.ctVal
      //     const orderSizeInContract = Math.round(btcPriceInUsd / contractFaceValue)

      assert(response, ApiError.UNSUPPORTED_API_RESPONSE)

      return {
        ok: true,
        value: {
          originalResponseAsIs: response,
          minimumOrderSizeInContract: 0,
          contractFaceValue: 0,
        },
      }
    } catch (error) {
      return { ok: false, error: error }
    }
  }
}
