import { baseLogger } from "@services/logger"
import { UserWallet } from "@core/user-wallet"
import { SpecterWallet } from "@core/specter-wallet"
import { getActiveOnchainLnd } from "@services/lnd/utils"
import { getSpecterWalletConfig } from "@config"

import {
  bitcoindClient,
  createMandatoryUsers,
  getChainBalance,
  mineBlockAndSyncAll,
} from "test/helpers"
import { getBitcoindTransactions } from "test/helpers/ledger"

const { lnd } = getActiveOnchainLnd()
const specterWalletName = "specter/coldstorage"
let specterWallet

beforeEach(async () => {
  await createMandatoryUsers()

  UserWallet.setCurrentPrice(10000)
  const specterWalletConfig = getSpecterWalletConfig()
  specterWallet = new SpecterWallet({ logger: baseLogger, config: specterWalletConfig })
})

afterAll(async () => {
  await bitcoindClient.unloadWallet({ walletName: specterWalletName })
})

describe("SpecterWallet", () => {
  it("creates wallet", async () => {
    await specterWallet.createWallet()
    const wallets = await specterWallet.listWallets()
    expect(wallets.length).toBe(1)
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
    } = await getBitcoindTransactions({ type: "to_cold_storage" })

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
