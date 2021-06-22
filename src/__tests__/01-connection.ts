/**
 * @jest-environment node
 */
import { setupMongoConnection } from "../mongodb"

import { lndMain, lndOutside1, lndOutside2 } from "./helper"
import { bitcoindDefaultClient } from "../utils"
import mongoose from "mongoose"
import { User } from "../schema"

//TODO: Choose between camel case or underscores for variable naming
import { getWalletInfo } from "lightning"
import { redis } from "../redis"

jest.mock("../realtimePrice")

it("I can connect to bitcoind", async () => {
  const { chain } = await bitcoindDefaultClient.getBlockchainInfo()
  expect(chain).toEqual("regtest")
})

it("I can connect to bank lnd", async () => {
  const { public_key } = await getWalletInfo({ lnd: lndMain })
  expect(public_key.length).toBe(64 + 2)
})

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
