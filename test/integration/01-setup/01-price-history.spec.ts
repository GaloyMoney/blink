import { Types as MongooseTypes } from "mongoose"
import { PriceHistory } from "@services/price/schema"
import { chunk, generateSatoshiPriceHistory } from "test/helpers"

describe("Price history", () => {
  it("generates 1 year of data", async () => {
    const pair = "BTC/USD"
    const exchange = "bitfinex"
    let doc = await PriceHistory.findOne({
      "pair.name": pair,
      "pair.exchange.name": exchange,
    })

    if (doc) {
      expect(doc.pair.exchange.price.length).toBeGreaterThanOrEqual(8780)
      return
    }

    doc = new PriceHistory({ pair: { name: pair, exchange: { name: exchange } } })
    await doc.save()

    const bulkOps = chunk(generateSatoshiPriceHistory(1 * 12, 50000), 500).map((c) => ({
      updateOne: {
        filter: { _id: new MongooseTypes.ObjectId(doc.id) },
        update: {
          $push: {
            "pair.exchange.price": {
              $each: c.map((d) => ({ _id: d.date, o: d.price / Math.pow(10, 8) })),
            },
          },
        },
      },
    }))

    const result = await PriceHistory.bulkWrite(bulkOps, { ordered: true })
    expect(result).toHaveProperty("ok", 1)
    expect(result.nModified).toBeGreaterThanOrEqual(18)
  })
})
