import { setupMongoConnection } from "src/mongodb"
import { redis } from "src/redis"
import { User } from "src/schema"
import {
  lnd1,
  lnd2,
  lndOutside1,
  lndOutside2,
  getWalletInfo,
  bitcoindClient,
} from "test/helpers"

it("should connect to bitcoind", async () => {
  const { chain } = await bitcoindClient.getBlockchainInfo()
  expect(chain).toEqual("regtest")
})

const lnds = [lnd1, lnd2]
for (const item in lnds) {
  it(`should connect to lnd${+item + 1}`, async () => {
    const { public_key } = await getWalletInfo({ lnd: lnds[item] })
    expect(public_key.length).toBe(64 + 2)
  })
}

it("should connect to outside lnds", async () => {
  const lnds = [lndOutside1, lndOutside2]
  for (const lnd of lnds) {
    const { public_key } = await getWalletInfo({ lnd })
    expect(public_key.length).toBe(64 + 2)
  }
})

it("should connect to mongodb", async () => {
  const mongoose = await setupMongoConnection()
  expect(mongoose.connection.readyState).toBe(1)

  const db = mongoose.connection.db;
  // Get all collections
  const collections = await db.listCollections().toArray();
  // Create an array of collection names and drop each collection
  collections
  .map((collection) => collection.name)
  .forEach(async (collectionName) => {
    db.dropCollection(collectionName);
  });

  const users = await User.find()
  expect(users).toBeInstanceOf(Array)
  await mongoose.connection.close()
})

it("should connect to redis", async () => {
  const value = "value"
  await redis.set("key", value)
  const result = await redis.get("key")
  expect(result).toBe(value)
})
