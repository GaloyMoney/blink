import { getSpecterWalletConfig } from "@config/app"
import { SpecterWallet } from "@core/specter-wallet"
import { UserWallet } from "@core/user-wallet"
import { toSats } from "@domain/bitcoin"
import { WalletAlreadyExistError } from "@domain/bitcoin/onchain"
import { getActiveOnchainLnd } from "@services/lnd/utils"
import { baseLogger } from "@services/logger"

import { bitcoindClient, getChainBalance, mineBlockAndSyncAll } from "test/helpers"
import { getBitcoindTransactions } from "test/helpers/ledger"

const { lnd } = getActiveOnchainLnd()
const specterWalletName = "specter/coldstorage" as BitcoindWalletName
let specterWallet: SpecterWallet

beforeEach(() => {
  UserWallet.setCurrentPrice(10000)
  const specterWalletConfig = getSpecterWalletConfig()
  specterWallet = new SpecterWallet({ logger: baseLogger, config: specterWalletConfig })
})

afterAll(async () => {
  await bitcoindClient.unloadWallet(specterWalletName)
})

describe("SpecterWallet", () => {
  it("creates wallet", async () => {
    const result = await bitcoindClient.createWallet(specterWalletName)
    if (result instanceof WalletAlreadyExistError) {
      await bitcoindClient.loadWallet(specterWalletName)
    }

    const wallets = await bitcoindClient.listWallets()
    expect(wallets.length).toBe(1)
  })

  it("deposit to bitcoind", async () => {
    const initBitcoindBalance = await specterWallet.getBitcoindBalance()
    const { chain_balance: initLndBalance } = await getChainBalance({ lnd })

    const sats = toSats(10_000)
    await specterWallet.toColdStorage(sats)
    await mineBlockAndSyncAll(/* 1001 */)

    const bitcoindBalance = await specterWallet.getBitcoindBalance()
    const { chain_balance: lndBalance } = await getChainBalance({ lnd })

    console.log({ bitcoindBalance, lndBalance, sats, initBitcoindBalance }, "sats123")
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
