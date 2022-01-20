import { ColdStorage } from "@app"
import { getColdStorageConfig } from "@config/app"
import { InsufficientBalanceForRebalanceError } from "@domain/cold-storage/errors"

import { bitcoindClient, checkIsBalanced } from "test/helpers"

let walletName: string
beforeAll(async () => {
  const { onchainWallet } = getColdStorageConfig()

  const wallets = await bitcoindClient.listWallets()
  walletName =
    wallets.find((item) => item.includes(onchainWallet)) || "specter/coldstorage"
})

afterEach(async () => {
  await checkIsBalanced()
})

describe("ColdStorage - rebalanceToHotWallet", () => {
  it("creates a psbt successfully", async () => {
    const result = await ColdStorage.rebalanceToHotWallet({
      walletName,
      amount: 10000,
      targetConfirmations: 1,
    })
    expect(result).not.toBeInstanceOf(Error)
    expect(result).toEqual(
      expect.objectContaining({
        psbt: expect.any(String),
        fee: expect.any(Number),
      }),
    )
  })

  it("fails if insufficient balance", async () => {
    const result = await ColdStorage.rebalanceToHotWallet({
      walletName,
      amount: 10_010_000_000,
      targetConfirmations: 1,
    })
    expect(result).toBeInstanceOf(InsufficientBalanceForRebalanceError)
  })
})
