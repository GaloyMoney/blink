import { priceBTC, recordPrice } from "./price"
import { setupMongoose } from "./db";
const mongoose = require("mongoose");

beforeAll(async () => {
  await setupMongoose()
  await mongoose.connection.dropDatabase()
})

it('test getting price', async () => {
    const price = await priceBTC()
    console.log({price})
    expect(price).toBeTruthy() // FIXME test will fail if kraken offline
})

it('test saving price to db', async () => {
    const price = await priceBTC()
    await recordPrice()
    const PriceHistoryModel = mongoose.model("PriceHistory")
    const lastEntry = await PriceHistoryModel.findOne({}).sort({created_at: -1})
    expect(lastEntry.price).toBeCloseTo(price, 6)
})
