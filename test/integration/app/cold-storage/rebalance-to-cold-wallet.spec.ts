import { ColdStorage } from "@app"
import * as appConfig from "@config"
import { btc2sat, toSats } from "@domain/bitcoin"
import { RebalanceChecker } from "@domain/cold-storage"
import { BitcoindWalletClient } from "@services/bitcoind"
import { lndsBalances } from "@services/lnd/utils"

import { bitcoindClient, checkIsBalanced, mineBlockAndSyncAll } from "test/helpers"

jest.mock("@config", () => {
  const config = jest.requireActual("@config")
  return {
    ...config,
    getColdStorageConfig: jest.fn(() => config.getColdStorageConfig()),
  }
})

let coldStorageWalletClient: BitcoindWalletClient

beforeAll(async () => {
  const { onChainWallet } = appConfig.getColdStorageConfig()

  const wallets = await bitcoindClient.listWallets()
  const walletName = wallets.find((item) => item.includes(onChainWallet))
  if (!walletName) throw new Error("Invalid specter wallet name")

  coldStorageWalletClient = new BitcoindWalletClient(walletName)
})

afterEach(async () => {
  await checkIsBalanced()
})

describe("ColdStorage - rebalanceToColdWallet", () => {
  it("rebalance successfully", async () => {
    const coldStorageConfig = appConfig.getColdStorageConfig()
    const getColdStorageConfigMock = appConfig.getColdStorageConfig as jest.Mock
    const config = {
      ...coldStorageConfig,
      minOnChainHotWalletBalance: toSats(100000),
      maxHotWalletBalance: toSats(100000),
      minRebalanceSize: toSats(10000),
    }
    getColdStorageConfigMock.mockReturnValueOnce(config)

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
    const getColdStorageConfigMock = appConfig.getColdStorageConfig as jest.Mock
    const config = {
      ...coldStorageConfig,
      minOnChainHotWalletBalance: btc2sat(20),
      maxHotWalletBalance: btc2sat(20),
      minRebalanceSize: btc2sat(20),
    }
    getColdStorageConfigMock.mockReturnValueOnce(config)

    const initialBalance = await coldStorageWalletClient.getBalance()

    const result = await ColdStorage.rebalanceToColdWallet()
    expect(result).not.toBeInstanceOf(Error)
    expect(result).toBeFalsy()

    await mineBlockAndSyncAll()

    const finalBalance = await coldStorageWalletClient.getBalance()
    expect(btc2sat(finalBalance)).toBe(btc2sat(initialBalance))
  })
})
