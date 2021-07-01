import { sleep } from "../utils"
import ccxt, { ExchangeId, Order } from "ccxt"

export enum SupportedExchanges {
  FTX = "ftx",
  OKEXv3 = "okex",
  OKEXv5 = "okex5",
}

export class ApiConfig {
  constructor(
    public exchangeId: SupportedExchanges | undefined,
    public apiKey: string | undefined,
    public secret: string | undefined,
    public password: string | undefined,
  ) {
    this.exchangeId = exchangeId
  }
}

export class GenericExchange {
  exchangeId: ExchangeId
  exchange
  defaultSymbol

  constructor(apiConfig: ApiConfig) {
    this.exchangeId = apiConfig.exchangeId as ExchangeId
    const exchangeClass = ccxt[this.exchangeId]
    this.exchange = new exchangeClass({
      apiKey: apiConfig.apiKey,
      secret: apiConfig.secret,
      password: apiConfig.password,
    })

    // Should we check at init that we have required credentials?
    this.exchange.checkRequiredCredentials()
  }

  public GetSymbol() {
    // TODO: Should resolve best instrument to used given the exchange and the market conditions.
    // const optimalSymbol = this.getOptimalSymbol;
    // this.defaultSymbol = optimalSymbol;

    const ftxDefaultSymbol = "BTC-PERP"
    const okexDefaultSymbol = "BTC-USD-211231"

    if (this.exchangeId === SupportedExchanges.FTX) {
      this.defaultSymbol = ftxDefaultSymbol
    } else if (this.exchangeId === SupportedExchanges.OKEXv3) {
      this.defaultSymbol = okexDefaultSymbol
    } else if (this.exchangeId === SupportedExchanges.OKEXv5) {
      this.defaultSymbol = okexDefaultSymbol
    }

    return this.defaultSymbol
  }

  public has() {
    const has = this.exchange.has
    return has
  }

  public has2() {
    const has = this.exchange.has
    return has
  }

  public name() {
    const name = this.exchange.name
    return name
  }

  async fetchDepositAddress(currency: string) {
    const address = await this.exchange.fetchDepositAddress(currency)
    return address
  }

  public async withdraw(currency: string, amount: number, address: string) {
    const withdrawalResult = await this.exchange.withdraw(currency, amount, address)
    return withdrawalResult
  }

  public async createOrder(
    symbol: string,
    type: Order["type"],
    side: Order["side"],
    amount: number,
  ) {
    const order = await this.exchange.createOrder(symbol, type, side, amount)
    return order
  }

  public async fetchOrder(id: string) {
    const order = await this.exchange.fetchOrder(id, this.defaultSymbol)
    return order
  }

  public async getPositions() {
    const positions = await this.exchange.fetchPositions()
    return positions
  }

  public async fetchBalance() {
    const balances = await this.exchange.fetchBalance()
    return balances.info
  }

  public async getBtcSpot() {
    return this.getFilteredInstrument("BTC", "spot")
  }

  public async getBtcFutures() {
    return this.getFilteredInstrument("BTC", "future")
  }

  public async loadMarkets() {
    const markets = await this.exchange.loadMarkets(true)
    return markets
  }

  public async getFilteredInstrument(base: string, type: string) {
    const markets = await this.exchange.loadMarkets(true)
    let data = ""

    for (const symbol in markets) {
      try {
        if (!symbol.includes("MOVE")) {
          const market = markets[symbol]
          if (market["base"] === base || market["quote"] === base)
            if (market["type"] === type || market["type"] === type + "s") {
              const ticker = await this.exchange.fetchTicker(symbol)
              data += `symbol = ${symbol}\n`
              data += `Market = ${JSON.stringify(market)}\n`
              data += `Ticker = ${JSON.stringify(ticker)}\n`
              await sleep(this.exchange.rateLimit)
            }
        }
      } catch (error) {
        data += `error = ${error}\n`
      }
    }

    return data
  }

  public async getNextFundingRate(symbol: string) {
    if (this.exchangeId === SupportedExchanges.FTX) {
      const result = await this.exchange.publicGetFuturesFutureNameStats({
        future_name: symbol,
      })
      return result
    } else if (this.exchangeId === SupportedExchanges.OKEXv3) {
      const result = await this.exchange.publicGetFuturesFutureNameStats({
        future_name: symbol,
      })
      return result
    } else if (this.exchangeId === SupportedExchanges.OKEXv5) {
      const result = await this.exchange.publicGetFuturesFutureNameStats({
        future_name: symbol,
      })
      return result
    }
  }

  public async privateGetAccount() {
    if (this.exchangeId === SupportedExchanges.FTX) {
      const result = await this.exchange.privateGetAccount()
      return result
    } else if (this.exchangeId === SupportedExchanges.OKEXv3) {
      const result = await this.exchange.privateGetAccount()
      return result
    } else if (this.exchangeId === SupportedExchanges.OKEXv5) {
      const result = await this.exchange.privateGetAccount()
      return result
    }
  }

  public async getStats() {
    let data = ""
    if (this.exchangeId === SupportedExchanges.FTX) {
      data = this.exchange.publicGetFuturesFutureNameStats({
        future_name: this.defaultSymbol,
      })
    } else if (this.exchangeId === SupportedExchanges.OKEXv3) {
      data = this.exchange.fetchFundingFees({
        future_name: this.defaultSymbol,
      })
    } else if (this.exchangeId === SupportedExchanges.OKEXv5) {
      data = this.exchange.fetchFundingFees({
        future_name: this.defaultSymbol,
      })
    }
    return data
  }

  public async getMethods() {
    const data = Object.keys(this.exchange)
    return data
  }
}
