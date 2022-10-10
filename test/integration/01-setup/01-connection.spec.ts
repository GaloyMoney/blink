import { redis } from "@services/redis"
import { User } from "@services/mongoose/schema"

import { listIdentities } from "@services/kratos"

import {
  lnd1,
  lnd2,
  lndOutside1,
  lndOutside2,
  getWalletInfo,
  bitcoindClient,
  resetLnds,
  getChannels,
  getChainBalance,
} from "test/helpers"

it("connects to bitcoind", async () => {
  const { chain } = await bitcoindClient.getBlockchainInfo()
  expect(chain).toEqual("regtest")
})

describe("connects to lnds", () => {
  beforeAll(async () => {
    await resetLnds()
  })

  const lnds = [lnd1, lnd2]
  for (const item in lnds) {
    it(`connects to lnd${+item + 1}`, async () => {
      const { public_key } = await getWalletInfo({ lnd: lnds[item] })
      expect(public_key.length).toBe(64 + 2)

      const { channels } = await getChannels({ lnd: lnds[item] })
      expect(channels.length).toEqual(0)

      const { chain_balance: chainBalance } = await getChainBalance({ lnd: lnds[item] })
      expect(chainBalance).toEqual(0)
    })
  }

  it("connects to outside lnds", async () => {
    const lnds = [lndOutside1, lndOutside2]
    for (const lnd of lnds) {
      const { public_key } = await getWalletInfo({ lnd })
      expect(public_key.length).toBe(64 + 2)

      const { channels } = await getChannels({ lnd })
      expect(channels.length).toEqual(0)

      const { chain_balance: chainBalance } = await getChainBalance({ lnd })
      expect(chainBalance).toEqual(0)
    }
  })
})

it("connects to mongodb", async () => {
  const users = await User.find()
  expect(users).toBeInstanceOf(Array)
})

it("connects to redis", async () => {
  const value = "value"
  await redis.set("key", value)
  const result = await redis.get("key")
  expect(result).toBe(value)
})

it("connects to kratos", async () => {
  const users = await listIdentities()
  expect(users).not.toBeInstanceOf(Error)
  expect(Array.isArray(users)).toBe(true)
})
