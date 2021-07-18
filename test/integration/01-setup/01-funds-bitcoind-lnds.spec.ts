import { baseLogger } from "src/logger"
import { btc2sat } from "src/utils"
import { MainBook } from "src/mongodb"
import { liabilitiesReserve, lndAccountingPath } from "src/ledger/ledger"
import {
  checkIsBalanced,
  lnd1,
  lndOutside1,
  bitcoindClient,
  getChainBalance,
  fundLnd,
  waitUntilSyncAll,
} from "test/helpers"

jest.mock("src/realtimePrice", () => require("test/mocks/realtimePrice"))

const defaultWallet = ""

beforeEach(async () => {
  await waitUntilSyncAll()
})

describe("Bitcoind", () => {
  it("should be funded mining 10 blocks", async () => {
    const numOfBlock = 10
    try {
      const { name } = await bitcoindClient.createWallet(defaultWallet)
      // depends of bitcoind version. needed in < 0.20 but failed in 0.21?
      expect(name).toBe(defaultWallet)
    } catch (error) {
      baseLogger.warn({ error }, "bitcoind wallet already exists")
    }

    const bitcoindAddress = await bitcoindClient.getNewAddress()
    await bitcoindClient.mineAndConfirm(numOfBlock, bitcoindAddress)
    const balance = await bitcoindClient.getBalance()

    // invalid only when there are problems deleting channels and
    // they get confirmed while mineAndConfirm (101 blocks)
    expect(balance).toBeGreaterThanOrEqual(50 * numOfBlock)
  })

  it("funds outside lnd node", async () => {
    const amount = 1
    const { chain_balance: initialBalance } = await getChainBalance({ lnd: lndOutside1 })
    const sats = initialBalance + btc2sat(amount)
    await fundLnd(lndOutside1, amount)
    const { chain_balance: balance } = await getChainBalance({ lnd: lndOutside1 })
    expect(balance).toBe(sats)
  })

  it("funds lnd1 node", async () => {
    const amount = 1
    const { chain_balance: initialBalance } = await getChainBalance({ lnd: lnd1 })
    const sats = initialBalance + btc2sat(amount)
    await fundLnd(lnd1, amount)
    const { chain_balance: balance } = await getChainBalance({ lnd: lnd1 })

    expect(balance).toBe(sats)

    const metadata = { type: "onchain_receipt", currency: "BTC", pending: "false" }

    await MainBook.entry("funding tx")
      .credit(liabilitiesReserve, sats, metadata)
      .debit(lndAccountingPath, sats, metadata)
      .commit()

    await checkIsBalanced()
  })
})
