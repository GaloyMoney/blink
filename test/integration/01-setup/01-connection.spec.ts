import {
  BITCOIND_EVENTS,
  receiveRawBlockSubscriber,
  receiveRawTxSubscriber,
  SUB_ADDR_BLOCK,
  SUB_ADDR_TX,
} from "@services/bitcoind/subscribers"
import { setupMongoConnection } from "@services/mongodb"
import { redis } from "@services/redis"
import { User } from "@services/mongoose/schema"
import {
  lnd1,
  lnd2,
  lndOutside1,
  lndOutside2,
  getWalletInfo,
  bitcoindClient,
  resetDatabase,
  resetLnds,
  getChannels,
  getChainBalance,
} from "test/helpers"

jest.mock("@services/phone-provider", () => require("test/mocks/phone-provider"))

it("connects to bitcoind", async () => {
  const { chain } = await bitcoindClient.getBlockchainInfo()
  expect(chain).toEqual("regtest")
})

it("detect active bitcoind zeromq notifications", async () => {
  const config = await bitcoindClient.getZmqNotifications()
  const topics = [BITCOIND_EVENTS.RAW_BLOCK, BITCOIND_EVENTS.RAW_TX]
  expect(config.length).toEqual(topics.length * 2) // bitcoind returns 2 per topic
})

it("subscribe then close subscription to zeromq", async () => {
  const bitcoindBlockSubscriber = await receiveRawBlockSubscriber()
  const bitcoindTxSubscriber = await receiveRawTxSubscriber()
  expect(bitcoindBlockSubscriber.lastEndpoint).toBe(SUB_ADDR_BLOCK)
  expect(bitcoindTxSubscriber.lastEndpoint).toBe(SUB_ADDR_TX)
  bitcoindBlockSubscriber.close()
  bitcoindTxSubscriber.close()
  expect(bitcoindBlockSubscriber.closed).toBe(true)
  expect(bitcoindTxSubscriber.closed).toBe(true)
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
  const mongoose = await setupMongoConnection()
  expect(mongoose.connection.readyState).toBe(1)
  await resetDatabase(mongoose)
  const users = await User.find()
  expect(users).toBeInstanceOf(Array)
  await mongoose.connection.close()
})

it("connects to redis", async () => {
  const value = "value"
  await redis.set("key", value)
  const result = await redis.get("key")
  expect(result).toBe(value)
})
