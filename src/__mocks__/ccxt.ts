
const privateGetPositionsResponse = {result: 
  [{
    collateralUsed: 0.328866663378,
    cost: -0.9872,
    entryPrice: 9872,
    estimatedLiquidationPrice: 0,
    future: 'BTC-PERP',
    initialMarginRequirement: 0.33333333,
    longOrderSize: 0,
    maintenanceMarginRequirement: 0.03,
    netSize: -0.0001,
    openSize: 0.0001,
    realizedPnl: -0.01195,
    shortOrderSize: 0,
    side: 'sell',
    size: 0.0001,
    unrealizedPnl: 0.0006
}]}

const createMarketBuyOrderError = {error: "Size too small", success: false}


const fetchOrderResponse = {
  result: {
    info: {
      avgFillPrice: 9892.5,
      clientId: null,
      createdAt: '2020-06-23T00:00:58.777148+00:00',
      filledSize: 0.0001,
      future: 'BTC-PERP',
      id: 6103637365,
      ioc: true,
      liquidation: false,
      market: 'BTC-PERP',
      postOnly: false,
      price: null,
      reduceOnly: false,
      remainingSize: 0,
      side: 'buy',
      size: 0.0001,
      status: 'closed',
      type: 'market'
    },
    id: '6103637365',
    clientOrderId: undefined,
    timestamp: 1592870458777,
    datetime: '2020-06-23T00:00:58.777Z',
    lastTradeTimestamp: undefined,
    symbol: 'BTC-PERP',
    type: 'market',
    side: 'buy',
    price: 9892.5,
    amount: 0.0001,
    cost: 0.9892500000000001,
    average: 9892.5,
    filled: 0.0001,
    remaining: 0,
    status: 'closed',
    fee: undefined,
    trades: undefined
  }
}

const createMarketBuyOrderResponse = { result: {
  info: {
    avgFillPrice: null,
    clientId: null,
    createdAt: '2020-06-23T00:00:58.777148+00:00',
    filledSize: 0,
    future: 'BTC-PERP',
    id: 6103637365,
    ioc: true,
    liquidation: false,
    market: 'BTC-PERP',
    postOnly: false,
    price: null,
    reduceOnly: false,
    remainingSize: 0.0001,
    side: 'buy',
    size: 0.0001,
    status: 'new',
    type: 'market'
  },
  id: '6103637365',
  clientOrderId: undefined,
  timestamp: 1592870458777,
  datetime: '2020-06-23T00:00:58.777Z',
  lastTradeTimestamp: undefined,
  symbol: 'BTC-PERP',
  type: 'market',
  side: 'buy',
  price: undefined,
  amount: 0.0001,
  cost: undefined,
  average: undefined,
  filled: 0,
  remaining: 0.0001,
  status: 'open',
  fee: undefined,
  trades: undefined
}}


export class ftx {

  constructor() {}

  privateGetPositions() {
    return new Promise((resolve, reject) => {
      resolve(privateGetPositionsResponse)
    })
  }

  fetchOrder() {
    return new Promise((resolve, reject) => {
      resolve(createMarketBuyOrderResponse)
    })
  }

  createMarketBuyOrder(symbol, amount) {
    return new Promise((resolve, reject) => {
      if (amount >= 0.0001) {
        resolve(createMarketBuyOrderResponse)
      } else {
        reject(createMarketBuyOrderError)
      }
    })
  }

}