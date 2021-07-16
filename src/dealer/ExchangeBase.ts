import {
  FetchDepositAddressResult,
  WithdrawParameters,
  WithdrawResult,
  CreateOrderParameters,
  CreateOrderResult,
  FetchOrderResult,
  GetAccountAndPositionRiskResult,
  GetInstrumentDetailsResult,
  ApiError,
} from "./ExchangeTradingType"
import { Result } from "./Result"
import ccxt, { ExchangeId } from "ccxt"

export enum SupportedExchange {
  FTX = "ftx",
  OKEX5 = "okex5",
}

export class ApiConfig {
  constructor(
    public exchangeId: SupportedExchange,
    public strategySymbol: string,
    public apiKey: string,
    public secret: string,
    public password: string,
  ) {
    this.exchangeId = exchangeId
  }
}

export abstract class ExchangeBase {
  exchangeId: ExchangeId
  exchange
  symbol

  constructor(apiConfig: ApiConfig) {
    this.exchangeId = apiConfig.exchangeId as ExchangeId
    this.symbol = apiConfig.strategySymbol
    const exchangeClass = ccxt[this.exchangeId]
    this.exchange = new exchangeClass({
      apiKey: apiConfig.apiKey,
      secret: apiConfig.secret,
      password: apiConfig.password,
    })

    // The following check throws if something is wrong
    this.exchange.checkRequiredCredentials()
  }

  protected validate(condition: boolean, error: ApiError) {
    if (!condition) {
      throw new Error(error)
    }
  }

  abstract fetchDepositAddress(
    currency: string,
  ): Promise<Result<FetchDepositAddressResult>>
  abstract withdraw(args: WithdrawParameters): Promise<Result<WithdrawResult>>
  abstract createMarketOrder(
    args: CreateOrderParameters,
  ): Promise<Result<CreateOrderResult>>
  abstract fetchOrder(id: string): Promise<Result<FetchOrderResult>>
  abstract getAccountAndPositionRisk(
    btcPriceInUsd: number,
  ): Promise<Result<GetAccountAndPositionRiskResult>>
  abstract getInstrumentDetails(): Promise<Result<GetInstrumentDetailsResult>>
}
