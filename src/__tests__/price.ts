/**
 * @jest-environment node
 */

import { setupMongoConnection } from "../mongodb"
// this import needs to be before medici

import { Price } from "../priceImpl";
const mongoose = require("mongoose");

let price

beforeAll(async () => {
  // await mongoose.connection.dropDatabase()
  await setupMongoConnection()
  price = new Price()
})

afterAll(async () => {
  return await mongoose.connection.close()
});

it('test updating price', async () => {
  await price.update()
  // test it doesn't throw an error
})

it('test fetching last 24 hours', async () => {
  const priceHistory = await price.lastCached()
  // expect(priceHistory.length).toBe(25)
})

// it('test getting price', async () => {
//   const currPrice = await price.getFromExchange()
//   expect(currPrice).toBeTruthy() // FIXME test will fail if kraken offline
// })

// it('test saving price to db', async () => {
//   const currPrice = await price.getFromExchange()
//   await price.update()
//   const PriceHistoryModel = mongoose.model("PriceHistory")
//   const lastEntry = await PriceHistoryModel.findOne({}).sort({created_at: -1})
//   expect(lastEntry.price).toBeCloseTo(currPrice, 6)
// })
