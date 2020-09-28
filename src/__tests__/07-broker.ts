/**
 * @jest-environment node
 */
import { setupMongoConnection } from "../mongodb"
import { LightningBrokerWallet } from "../LightningBrokerWallet";
import { quit } from "../lock";
const mongoose = require("mongoose");
const util = require('util')


// jest.mock('./LightningAdminImpl')

const lastBTCPrice = 0.000096006

let brokerWallet

beforeAll(async () => {
  await setupMongoConnection()
  brokerWallet = new LightningBrokerWallet({uid: "broker"})

})

afterAll(async () => {
  // await mongoose.connection.close()
  // await quit()
})

// it('node balance', async () => {
//   const liabilities = await brokerWallet.getLocalLiabilities()
//   console.log({liabilities})
// })

// it('balance', async () => {
//   const balance = await brokerWallet.getExchangeBalance()
//   console.log({balance})
// })

it('future', async () => {
  const future = await brokerWallet.getAccountPosition()
  console.log({future})
})

// it('leverage', async () => {
//   const future = await brokerWallet.getLeverage()
//   console.log({future})
// })

// it('ratio', async () => {
//   const ratio = await brokerWallet.getExposureRatio()
//   console.log({ratio})
// })

// it('btcBalance', async () => {
//   const btcBalance = await brokerWallet.satsBalance()
//   console.log(util.inspect({ btcBalance }, { showHidden: false, depth: null }))
// })

// it('create address', async () => {
//   const depositAddress = await brokerWallet.createDepositAddress()
//   console.log(util.inspect({ depositAddress }, { showHidden: false, depth: null }))
// })

// it('deposit address', async () => {
//   const depositAddress = await brokerWallet.exchangeDepositAddress()
//   console.log(util.inspect({ depositAddress }, { showHidden: false, depth: null }))
// })

// it('calculate hedging amount when under exposed', async () => {
//   const hedge = new Hedging()

//   const equity = 10 * 10 ** 8
//   const netSizeSats = - 7 * 10 ** 8

//   // const result = hedge.calculate({equity, netSizeSats, lastBTCPrice})
//   // expect(result).toEqual({needHedging: true, amount: 2 * 10 ** 8, direction: "sell"})
// })

// it('calculate hedging amount when over exposed', async () => {
//   const hedge = new Hedging()

//   const equity = 10 * 10 ** 8
//   const netSizeSats = - 13 * 10 ** 8

//   // const result = hedge.calculate({equity, netSizeSats, lastBTCPrice})
//   // expect(result).toEqual({needHedging: true, amount: 2 * 10 ** 8, direction: "buy"})
// })

// it('no need for hedging', async () => {
//   const hedge = new Hedging()

//   const equity = 10 * 10 ** 8
//   const netSizeSats = - 11 * 10 ** 8

//   // const result = hedge.calculate({equity, netSizeSats, lastBTCPrice})
//   // expect(result).toEqual({needHedging: false})
// })



// it('getting physical/future position', async () => {
//   const hedge = new Hedging()
//   const result = await hedge.getPosition()
//   console.log(result)
// })

