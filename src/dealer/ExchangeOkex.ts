import _ from "lodash"
import {
  FetchDepositAddressResult,
  WithdrawParameters,
  CreateOrderParameters,
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
      // OKEx has last price as apart of position data, may forgo input validation
      assert(btcPriceInUsd > 0, ApiError.MISSING_PARAMETERS)

      const position = await this.exchange.fetchPosition(this.symbol)
      this.logger.debug(
        { position },
        `exchange.fetchPosition(${this.symbol}) returned: {position}`,
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
        instId: this.symbol,
      })
      this.logger.debug(
        { response },
        `publicGetPublicInstruments(${this.symbol}) returned: {response}`,
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
