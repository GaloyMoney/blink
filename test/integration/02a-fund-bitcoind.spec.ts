import { setupMongoConnection } from "src/mongodb"
import {
  checkIsBalanced,
  lnd1,
  lndOutside1,
  lndOutside2,
  mockGetExchangeBalance,
  waitUntilBlockHeight,
  bitcoindClient,
  createChainAddress,
} from "test/helpers"

jest.mock("src/realtimePrice", () => require("test/mocks/realtimePrice"))

let mongoose
const numOfBlock = 10

beforeAll(async () => {
  mongoose = await setupMongoConnection()
  mockGetExchangeBalance()
})

afterEach(async () => {
  await checkIsBalanced()
})

afterAll(async () => {
  await mongoose.connection.close()
  jest.restoreAllMocks()
})

it("funds bitcoind wallet", async () => {
  try {
    // depend of bitcoind version. needed in < 0.20 but failed in 0.21?
    const { name } = await bitcoindClient.createWallet("")
    expect(name).toBe("")
  } catch (err) {
    console.log({ err })
  }

  const initialBitcoinWalletBalance = await bitcoindClient.getBalance()
  const bitcoindAddress = await bitcoindClient.getNewAddress()
  const rewards = await bitcoindClient.mineAndConfirm(numOfBlock, bitcoindAddress)
  const balance = await bitcoindClient.getBalance()

  expect(balance).toBe(initialBitcoinWalletBalance + rewards)
})

it("funds outside lnd node", async () => {
  const fundAmount = 1
  const { address } = await createChainAddress({ format: "p2wpkh", lnd: lndOutside1 })

  expect(address.substr(0, 4)).toBe("bcrt")

  await bitcoindClient.sendToAddressAndConfirm(address, fundAmount)

  const blockHeight = await bitcoindClient.getBlockCount()

  await waitUntilBlockHeight({ lnd: lnd1, blockHeight })
  await waitUntilBlockHeight({ lnd: lndOutside1, blockHeight })
  await waitUntilBlockHeight({ lnd: lndOutside2, blockHeight })
})
