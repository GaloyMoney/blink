import {
  FetchDepositAddressResult,
  WithdrawParameters,
  WithdrawResult,
  CreateOrderParameters,
  CreateOrderResult,
  FetchOrderResult,
  GetAccountAndPositionRiskResult,
  GetInstrumentDetailsResult,
} from "./ExchangeTradingType"
import { Result } from "./Result"
import ccxt, { ExchangeId } from "ccxt"

export enum SupportedExchange {
  FTX = "ftx",
  OKEX5 = "okex5",
}

export abstract class ExchangeBase {
  exchangeId: ExchangeId
  exchange
  symbol
  logger
  bypass

  constructor(exchangeId: SupportedExchange, strategySymbol: string, logger) {
    const apiKey = process.env[`${exchangeId.toUpperCase()}_KEY`]
    const secret = process.env[`${exchangeId.toUpperCase()}_SECRET`]
    const password = process.env[`${exchangeId.toUpperCase()}_PASSWORD`]

    if (!apiKey || !secret || !password) {
      throw new Error(`Missing ${exchangeId} exchange environment variables`)
    }

    this.exchangeId = exchangeId as ExchangeId
    this.symbol = strategySymbol
    const exchangeClass = ccxt[this.exchangeId]
    this.exchange = new exchangeClass({ apiKey, secret, password })
    this.bypass = this.exchange

    // The following check throws if something is wrong
    this.exchange.checkRequiredCredentials()

    this.logger = logger.child({ class: `${ExchangeBase.name}-${exchangeId}` })
  }

  abstract fetchDepositAddressValidateInput(currency: string)
  abstract fetchDepositAddressProcessApiResponse(response): FetchDepositAddressResult

  public async fetchDepositAddress(
    currency: string,
  ): Promise<Result<FetchDepositAddressResult>> {
    try {
      this.fetchDepositAddressValidateInput(currency)

      const response = await this.exchange.fetchDepositAddress(currency)
      this.logger.debug(
        { response },
        `exchange.fetchDepositAddress(${currency}) returned: {response}`,
      )

      const result = this.fetchDepositAddressProcessApiResponse(response)

      return {
        ok: true,
        value: result,
      }
    } catch (error) {
      return { ok: false, error: error }
    }
  }

  abstract withdrawValidateInput(args: WithdrawParameters)
  abstract withdrawValidateApiResponse(response)

  public async withdraw(args: WithdrawParameters): Promise<Result<WithdrawResult>> {
    try {
      this.withdrawValidateInput(args)

      const response = await this.exchange.withdraw(
        args.currency,
        args.quantity,
        args.address,
      )
      this.logger.debug(
        { response },
        `exchange.withdraw(${args.currency}, ${args.quantity}, ${args.address}) returned: {response}`,
      )

      this.withdrawValidateApiResponse(response)

      return {
        ok: true,
        value: {
          originalResponseAsIs: response,
          status: response.status,
        },
      }
    } catch (error) {
      return { ok: false, error: error }
    }
  }

  abstract createMarketOrderValidateInput(args: CreateOrderParameters)
  abstract createMarketOrderValidateApiResponse(response)

  public async createMarketOrder(
    args: CreateOrderParameters,
  ): Promise<Result<CreateOrderResult>> {
    try {
      this.createMarketOrderValidateInput(args)

      const response = await this.exchange.createMarketOrder(args.side, args.quantity)
      this.logger.debug(
        { response },
        `exchange.createMarketOrder(${args.side}, ${args.quantity}) returned: {response}`,
      )

      this.createMarketOrderValidateApiResponse(response)

      return {
        ok: true,
        value: {
          originalResponseAsIs: response,
          id: response.id,
        },
      }
    } catch (error) {
      return { ok: false, error: error }
    }
  }

  abstract fetchOrderValidateInput(id: string)
  abstract fetchOrderValidateApiResponse(response)

  public async fetchOrder(id: string): Promise<Result<FetchOrderResult>> {
    try {
      this.fetchOrderValidateInput(id)

      // call api
      const response = await this.exchange.fetchOrder(id)
      this.logger.debug({ response }, `exchange.fetchOrder(${id}) returned: {response}`)

      this.fetchOrderValidateApiResponse(response)

      return {
        ok: true,
        value: {
          originalResponseAsIs: response,
          status: response.status,
        },
      }
    } catch (error) {
      return { ok: false, error: error }
    }
  }

  abstract getAccountAndPositionRisk(
    btcPriceInUsd: number,
  ): Promise<Result<GetAccountAndPositionRiskResult>>

  abstract getInstrumentDetails(): Promise<Result<GetInstrumentDetailsResult>>
}
