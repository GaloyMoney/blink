import { sleep } from "../utils"
import ccxt, { ExchangeId, Order } from "ccxt"

export type SupportedExchanges = "ftx" | "okex5"

export class ApiConfig {
  constructor(
    public exchangeId: SupportedExchanges,
    public apiKey: string,
    public secret: string,
    public password: string,
  ) {
    this.exchangeId = exchangeId
  }
}

export class GenericExchange {
  exchangeId: ExchangeId
  exchange
  public symbol

  constructor(apiConfig: ApiConfig) {
    this.exchangeId = apiConfig.exchangeId as ExchangeId
    const exchangeClass = ccxt[this.exchangeId]
    this.exchange = new exchangeClass({
      apiKey: apiConfig.apiKey,
      secret: apiConfig.secret,
      password: apiConfig.password,
    })

    this.SetSymbol()

    // Should we check at init that we have required credentials?
    this.exchange.checkRequiredCredentials()
  }

  public SetSymbol() {
    // Ultimately the hedging strategy determines the instrument/symbol
    // for now has we have an implicit and static hedging strategy embedded in the dealer wallet code,
    // we can define the appropriate symbol statically

    const exchangeMapping = {
      ftx: "BTC-PERP",
      okexv5: "BTC-USD-SWAP",
    }

    this.symbol = exchangeMapping[this.exchangeId]
  }

  public has() {
    return this.exchange.has
  }

  public name() {
    return this.exchange.name
  }

  async fetchDepositAddress(currency: string) {
    return this.exchange.fetchDepositAddress(currency)
  }

  public async withdraw(currency: string, amount: number, address: string) {
    return this.exchange.withdraw(currency, amount, address)
  }

  public async createOrder(type: Order["type"], side: Order["side"], amount: number) {
    return this.exchange.createOrder(this.symbol, type, side, amount)
  }

  public async fetchOrder(id: string) {
    const order = await this.exchange.fetchOrder(id, this.symbol)
    return order
  }

  public async getPositions() {
    const positions = await this.exchange.fetchPositions()
    return positions
  }

  public async fetchBalance() {
    return this.exchange.fetchBalance()
  }

  public async getNextFundingRate() {
    // type it SupportedExchanges: func
    const getNextFundingRateMapping = {
      ftx: {
        func: this.exchange.publicGetFuturesFutureNameStats,
        arg: { future_name: this.symbol },
      },
      okex5: {
        func: this.exchange.publicGetPublicFundingRate,
        arg: { instId: this.symbol },
      },
    }

    const func = getNextFundingRateMapping[this.exchangeId].func
    const arg = getNextFundingRateMapping[this.exchangeId].arg
    return func(arg)
  }

  public async privateGetAccount() {
    const privateGetAccountMapping = {
      ftx: {
        func: this.exchange.privateGetAccount,
      },
      okex5: {
        func: this.exchange.privateGetAccount,
      },
    }
    const func = privateGetAccountMapping[this.exchangeId].func
    return func()
  }

  public async getMethods() {
    return Object.keys(this.exchange)
  }
}
