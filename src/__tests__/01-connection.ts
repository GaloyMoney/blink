/**
 * @jest-environment node
 */
//TODO: Choose between camel case or underscores for variable naming
import { getWalletInfo } from "lightning"
import mongoose from "mongoose"
import { setupMongoConnection } from "../mongodb"
import { redis } from "../redis"
import { User } from "../schema"
import { bitcoindDefaultClient } from "../utils"
import { lnd1, lnd2, lndOutside1, lndOutside2 } from "./helper"

jest.mock("../realtimePrice")

it("I can connect to bitcoind", async () => {
  const { chain } = await bitcoindDefaultClient.getBlockchainInfo()
  expect(chain).toEqual("regtest")
})

const lnds = [lnd1, lnd2]
for (const item in lnds) {
  it(`I can connect to lnd index ${item}`, async () => {
    const { public_key } = await getWalletInfo({ lnd: lnds[item] })
    expect(public_key.length).toBe(64 + 2)
  })
}

it("I can connect to outside lnds", async () => {
  const lnds = [lndOutside1, lndOutside2]
  for (const lnd of lnds) {
    const { public_key } = await getWalletInfo({ lnd })
    expect(public_key.length).toBe(64 + 2)
  }
})

it("I can connect to mongodb", async () => {
  await setupMongoConnection()
  expect(mongoose.connection.readyState).toBe(1)
  const users = await User.find()
  expect(users).toEqual(expect.arrayContaining([]))
  await mongoose.connection.close()
})

it("I can connect to redis", async () => {
  const value = "value"

  redis.on("error", function (error) {
    console.log({ error })
    // expect(true).toBeFalsy()
  })

  await redis.set("key", value)
  const result = await redis.get("key")

  expect(result).toBe(value)
})
