
const privateGetPositionsResponse = {result: 
  [{
    collateralUsed: 0.328866663378,
    cost: -0.9872,
    entryPrice: 9872,
    estimatedLiquidationPrice: 0,
    future: 'BTC-1225',
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

export class ftx {

  constructor() {}

  privateGetPositions() {
    return new Promise((resolve, reject) => {
      console.log("promise")
      resolve(privateGetPositionsResponse)
    })
  }

}