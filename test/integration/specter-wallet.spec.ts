import { getSpecterWalletConfig } from "src/config"
import { baseLogger } from "src/logger"
import { UserWallet } from "src/userWallet"
import { SpecterWallet } from "src/SpecterWallet"
import { getActiveOnchainLnd } from "src/lndUtils"
import { bitcoindClient, getChainBalance, mineBlockAndSyncAll } from "test/helpers"
import { MainBook } from "src/mongodb"
import { bitcoindAccountingPath } from "src/ledger/ledger"

const { lnd } = getActiveOnchainLnd()
const specterWalletName = "specter/coldstorage"
let specterWallet

beforeEach(() => {
  UserWallet.setCurrentPrice(10000)
  const specterWalletConfig = getSpecterWalletConfig()
  specterWallet = new SpecterWallet({ logger: baseLogger, config: specterWalletConfig })
})

afterAll(async () => {
  await bitcoindClient.unloadWallet({ wallet_name: specterWalletName })
})

describe("SpecterWallet", () => {
  it("creates wallet", async () => {
    let wallets = await specterWallet.listWallets() // now ["outside", "hot"]

    // TODO maybe this should be explicitly checking wallet names instead of a count?
    if (wallets.length < 2) {
      // if (wallets.length < 3) {
      try {
        await specterWallet.createWallet()
      } catch {
        // TODO Why a try catch here?
        const { name } = await bitcoindClient.loadWallet(specterWalletName)
        expect(name).toBe(specterWalletName)
      }
    }

    wallets = await specterWallet.listWallets()
    expect(wallets.length).toBe(2)
    // expect(wallets.length).toBe(3)
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
