import ccxt, { ExchangeId, Order } from "ccxt";

export class ApiConfig {
    constructor(
        public apiKey: string | undefined,
        public secret: string | undefined,
        public password: string | undefined
    ) {
        ;
    };
}

export class GenericExchange {
    exchangeName;
    exchange;
    symbol;

    constructor(
        exchangeName: string,
        apiConfig: ApiConfig,
        symbol: string
    ) {
        this.exchangeName = exchangeName;
        this.symbol = symbol;
        const exchangeId = this.exchangeName as ExchangeId;
        const exchangeClass = ccxt[exchangeId];
        this.exchange = new exchangeClass({
            apiKey: apiConfig.apiKey,
            secret: apiConfig.secret,
            password: apiConfig.password,
        });

        // Should we check at init that we have required credentials?
        this.exchange.checkRequiredCredentials();
    }

    public GetSymbol() {
        // Should resolve best instrument to used given the exchange and the market conditions.
        const optimalSymbol = this.symbol;
        this.symbol = optimalSymbol;
        return this.symbol;
    }

    public has() {
        const has = this.exchange.has;
        return has;
    }

    public has2() {
        const has = this.exchange.has;
        return has;
    }

    public name() {
        const name = this.exchange.name;
        return name;
    }

    async fetchDepositAddress(currency: string) {
        const address = await this.exchange.fetchDepositAddress(currency)
        return address;
    }

    public async withdraw(currency: string, amount: number, address: string) {
        const withdrawalResult = await this.exchange.withdraw(currency, amount, address)
        return withdrawalResult;
    }

    public async createOrder(symbol: string, type: Order['type'], side: Order['side'], amount: number) {
        const order = await this.exchange.createOrder(symbol, type, side, amount)
        return order;
    }

    public async fetchOrder(id: string) {
        const order = await this.exchange.fetchOrder(id, this.symbol)
        return order;
    }

    public async getPositions() {
        const positions = await this.exchange.fetchPositions();
        return positions;
    }

    public async fetchBalance() {
        const balances = await this.exchange.fetchBalance();
        return balances.info;
    }

    public async getBtcSpot() {
        return this.getInstrument("BTC", "spot");
    }

    public async getBtcFutures() {
        return this.getInstrument("BTC", "future");
    }

    public async getInstrument(base: string, type: string) {
        const markets = await this.exchange.loadMarkets(true);
        return markets;
    }

    public async getFilteredInstrument(base: string, type: string) {
        const markets = await this.exchange.loadMarkets(true);
        let data = "";

        for (let symbol in markets) {
            try {
                if (!symbol.includes("MOVE")) {
                    const market = markets[symbol];
                    if (market["base"] === base || market["quote"] === base)
                        if (market["type"] === type || market["type"] === type + "s") {
                            const ticker = await this.exchange.fetchTicker(symbol);
                            data += `symbol = ${symbol}\n`;
                            data += `Market = ${JSON.stringify(market)}\n`;
                            data += `Ticker = ${JSON.stringify(ticker)}\n`;
                            await (ccxt as any).sleep(this.exchange.rateLimit);
                        }
                }
            } catch (error) {
                data += `error = ${error}\n`;
            }
        }

        return data;
    }

    public async getNextFundingRate(symbol: string) {
        if (this.exchangeName === "ftx") {
            const result = await this.exchange.publicGetFuturesFutureNameStats({ future_name: symbol });
            return result;
        } else if (this.exchangeName === "okex" || this.exchangeName === "okex5") {
            const result = await this.exchange.publicGetFuturesFutureNameStats({ future_name: symbol });
            return result;
        }
    }

    public async privateGetAccount() {
        if (this.exchangeName === "ftx") {
            const result = await this.exchange.privateGetAccount();
            return result;
        } else if (this.exchangeName === "okex" || this.exchangeName === "okex5") {
            const result = await this.exchange.privateGetAccount();
            return result;
        }
    }

    public async getStats() {
        let data = "";
        if (this.exchangeName === "ftx") {
            data = this.exchange.publicGetFuturesFutureNameStats({
                future_name: this.symbol,
            });

        } else if (this.exchangeName === "okex" || this.exchangeName === "okex5") {
            data = this.exchange.fetchFundingFees({
                future_name: this.symbol,
            });
        }
        return data;
    }

    public async getMethods() {
        const data = Object.keys(this.exchange);
        return data;
    }
}
