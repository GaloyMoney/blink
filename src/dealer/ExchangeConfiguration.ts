import {
  FetchDepositAddressResult,
  WithdrawParameters,
  CreateOrderParameters,
  //   GetAccountAndPositionRiskResult,
  //   GetInstrumentDetailsResult,
} from "./ExchangeTradingType"
// import { Result } from "./Result"

export enum SupportedExchange {
  FTX = "ftx",
  OKEX5 = "okex5",
}
export enum SupportedInstrument {
  FTX_PERPETUAL_SWAP = "BTC-PERP",
  OKEX_PERPETUAL_SWAP = "BTC-USD-SWAP",
}

export interface ExchangeConfiguration {
  exchangeId: SupportedExchange
  instrumentId: SupportedInstrument

  fetchDepositAddressValidateInput(currency: string)
  fetchDepositAddressProcessApiResponse(response): FetchDepositAddressResult

  withdrawValidateInput(args: WithdrawParameters)
  withdrawValidateApiResponse(response)

  createMarketOrderValidateInput(args: CreateOrderParameters)
  createMarketOrderValidateApiResponse(response)

  fetchOrderValidateInput(id: string)
  fetchOrderValidateApiResponse(response)

  //   getAccountAndPositionRisk(
  //     btcPriceInUsd: number,
  //   ): Promise<Result<GetAccountAndPositionRiskResult>>

  //   getInstrumentDetails(): Promise<Result<GetInstrumentDetailsResult>>
}
