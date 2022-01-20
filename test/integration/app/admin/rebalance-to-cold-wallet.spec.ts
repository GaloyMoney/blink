import { ColdStorage } from "@app"
import * as appConfig from "@config/app"
import { btc2sat, toSats } from "@domain/bitcoin"
import { RebalanceChecker } from "@domain/cold-storage"
import { BitcoindWalletClient } from "@services/bitcoind"
import { lndsBalances } from "@services/lnd/utils"

import { bitcoindClient, checkIsBalanced, mineBlockAndSyncAll } from "test/helpers"

let coldStorageWalletClient: BitcoindWalletClient

beforeAll(async () => {
  const { onchainWallet } = appConfig.getColdStorageConfig()

  const wallets = await bitcoindClient.listWallets()
  const walletName = wallets.find((item) => item.includes(onchainWallet))
  if (!walletName) throw new Error("Invalid specter wallet name")

  coldStorageWalletClient = new BitcoindWalletClient({ walletName })
})

afterEach(async () => {
  await checkIsBalanced()
})

describe("Admin - rebalanceToColdWallet", () => {
  it("rebalance successfully", async () => {
    const coldStorageConfig = appConfig.getColdStorageConfig()
    const config = {
      minOnChainHotWalletBalance: toSats(100000),
      maxHotWalletBalance: toSats(100000),
      minRebalanceSize: toSats(10000),
      walletPattern: coldStorageConfig.walletPattern,
      onchainWallet: coldStorageConfig.onchainWallet,
      targetConfirmations: coldStorageConfig.targetConfirmations,
    }
    jest.spyOn(appConfig, "getColdStorageConfig").mockImplementationOnce(() => config)

    const initialBalance = await coldStorageWalletClient.getBalance()
    const { offChain, onChain } = await lndsBalances()

    const rebalanceAmount = RebalanceChecker(config).getWithdrawFromHotWalletAmount({
      onChainHotWalletBalance: onChain,
      offChainHotWalletBalance: offChain,
    })

    const result = await ColdStorage.rebalanceToColdWallet()
    expect(result).not.toBeInstanceOf(Error)
    expect(result).toBeTruthy()

    await mineBlockAndSyncAll()

    const finalBalance = await coldStorageWalletClient.getBalance()
    expect(btc2sat(finalBalance)).toBe(btc2sat(initialBalance) + rebalanceAmount)
  })

  it("returns false if no rebalance is needed", async () => {
    const coldStorageConfig = appConfig.getColdStorageConfig()
    const config = {
      minOnChainHotWalletBalance: btc2sat(20),
      maxHotWalletBalance: btc2sat(20),
      minRebalanceSize: btc2sat(20),
      walletPattern: coldStorageConfig.walletPattern,
      onchainWallet: coldStorageConfig.onchainWallet,
      targetConfirmations: coldStorageConfig.targetConfirmations,
    }
    jest.spyOn(appConfig, "getColdStorageConfig").mockImplementationOnce(() => config)

    const initialBalance = await coldStorageWalletClient.getBalance()

    const result = await ColdStorage.rebalanceToColdWallet()
    expect(result).not.toBeInstanceOf(Error)
    expect(result).toBeFalsy()

    await mineBlockAndSyncAll()

    const finalBalance = await coldStorageWalletClient.getBalance()
    expect(btc2sat(finalBalance)).toBe(btc2sat(initialBalance))
  })
})
