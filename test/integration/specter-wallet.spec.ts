import { baseLogger } from "src/logger"
import { UserWallet } from "src/userWallet"
import { SpecterWallet } from "src/SpecterWallet"
import { getActiveOnchainLnd } from "src/lndUtils"
import { getChainBalance, mineBlockAndSyncAll } from "test/helpers"
import { MainBook } from "src/mongodb"
import { bitcoindAccountingPath } from "src/ledger/ledger"

const { lnd } = getActiveOnchainLnd()
let specterWallet

beforeEach(async () => {
  UserWallet.setCurrentPrice(10000)
  specterWallet = new SpecterWallet({ logger: baseLogger })
})

describe("SpecterWallet", () => {
  it("creates wallet", async () => {
    let wallets = await SpecterWallet.listWallets()

    if (wallets.length < 2) {
      await SpecterWallet.createWallet()
    }

    wallets = await SpecterWallet.listWallets()
    expect(wallets.length).toBe(2)
  })

  it("deposit to bitcoind", async () => {
    const initBitcoindBalance = await specterWallet.getBitcoindBalance()
    const { chain_balance: initLndBalance } = await getChainBalance({ lnd })

    const sats = 10000
    await specterWallet.toColdStorage({ sats })
    await mineBlockAndSyncAll(/* 1001 */)

    const bitcoindBalance = await specterWallet.getBitcoindBalance()
    const { chain_balance: lndBalance } = await getChainBalance({ lnd })

    expect(bitcoindBalance).toBe(initBitcoindBalance + sats)

    const {
      results: [{ fee }],
    } = await MainBook.ledger({
      account: bitcoindAccountingPath,
      type: "to_cold_storage",
    })

    baseLogger.debug({
      lndBalance,
      initLndBalance,
      sats,
      fee,
      bitcoindBalance,
      initBitcoindBalance,
    })
    expect(lndBalance).toBe(initLndBalance - sats - fee)
  })

  // TODO: Fix or remove. Expectations were commented out
  it.skip("withdraw from bitcoind", async () => {
    const initBitcoindBalance = await specterWallet.getBitcoindBalance()
    const { chain_balance: initLndBalance } = await getChainBalance({ lnd })

    const sats = 5000
    await specterWallet.toLndWallet({ sats })
    await mineBlockAndSyncAll()

    const bitcoindBalance = await specterWallet.getBitcoindBalance()
    const { chain_balance: lndBalance } = await getChainBalance({ lnd })

    baseLogger.debug({ initBitcoindBalance, bitcoindBalance, lndBalance, initLndBalance })
    expect(bitcoindBalance).toBe(initBitcoindBalance - sats)
    expect(lndBalance).toBe(initLndBalance + sats)
  })
})
