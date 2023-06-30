import * as appConfig from "@config"

import { ColdStorage } from "@app"

import { btc2sat, toSats } from "@domain/bitcoin"
import { RebalanceChecker } from "@domain/cold-storage"

import { lndsBalances } from "@services/lnd/utils"
import { getFunderWalletId } from "@services/ledger/caching"

import {
  bitcoindClient,
  checkIsBalanced,
  fundWalletIdFromOnchain,
  lnd1,
  mineBlockAndSyncAll,
} from "test/helpers"

jest.mock("@config", () => {
  const config = jest.requireActual("@config")
  return {
    ...config,
    getColdStorageConfig: jest.fn(() => config.getColdStorageConfig()),
  }
})

let walletName: string

beforeAll(async () => {
  const { onChainWallet } = appConfig.getColdStorageConfig()

  const wallets = await ColdStorage.listWallets()
  if (wallets instanceof Error) throw wallets

  walletName =
    wallets.find((item) => item.includes(onChainWallet)) || "specter/coldstorage"

  // Note: Needed to clean up any pending txns since test adds pending txns to balance
  //       while onChainService does not.
  await mineBlockAndSyncAll()

  await bitcoindClient.loadWallet({ filename: "outside" })
  const funderWalletId = await getFunderWalletId()
  await fundWalletIdFromOnchain({
    walletId: funderWalletId,
    amountInBitcoin: 1.0,
    lnd: lnd1,
  })
})

afterEach(async () => {
  await checkIsBalanced()
})

afterAll(async () => {
  await bitcoindClient.unloadWallet({ walletName: "outside" })
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

    const initialBalance = await ColdStorage.getBalance(walletName)
    if (initialBalance instanceof Error) throw initialBalance

    const { offChain, onChain } = await lndsBalances()

    const rebalanceAmount = RebalanceChecker(config).getWithdrawFromHotWalletAmount({
      onChainHotWalletBalance: onChain,
      offChainHotWalletBalance: offChain,
    })

    const result = await ColdStorage.rebalanceToColdWallet()
    expect(result).not.toBeInstanceOf(Error)
    expect(result).toBeTruthy()

    await mineBlockAndSyncAll()

    const finalBalance = await ColdStorage.getBalance(walletName)
    if (finalBalance instanceof Error) throw finalBalance

    expect(finalBalance.amount).toBe(initialBalance.amount + rebalanceAmount)
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

    const initialBalance = await ColdStorage.getBalance(walletName)
    if (initialBalance instanceof Error) throw initialBalance

    const result = await ColdStorage.rebalanceToColdWallet()
    expect(result).not.toBeInstanceOf(Error)
    expect(result).toBeFalsy()

    await mineBlockAndSyncAll()

    const finalBalance = await ColdStorage.getBalance(walletName)
    if (finalBalance instanceof Error) throw finalBalance

    expect(finalBalance.amount).toBe(initialBalance.amount)
  })
})
