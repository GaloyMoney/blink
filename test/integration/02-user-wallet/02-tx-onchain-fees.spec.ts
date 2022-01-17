import { Wallets } from "@app"
import { getOnChainWalletConfig } from "@config/app"
import { toSats, toTargetConfs } from "@domain/bitcoin"
import { InsufficientBalanceError, LessThanDustThresholdError } from "@domain/errors"
import { AccountsRepository, WalletsRepository } from "@services/mongoose"

import {
  bitcoindClient,
  bitcoindOutside,
  createUserWallet,
  getDefaultWalletByTestUserIndex,
} from "test/helpers"

const defaultAmount = toSats(6000)
const defaultTarget = toTargetConfs(3)
const { dustThreshold } = getOnChainWalletConfig()
let wallet0: Wallet, wallet1: Wallet

beforeAll(async () => {
  await createUserWallet(0)
  await createUserWallet(1)

  wallet0 = await getDefaultWalletByTestUserIndex(0)
  wallet1 = await getDefaultWalletByTestUserIndex(1)
  await bitcoindClient.loadWallet({ filename: "outside" })
})

afterAll(async () => {
  await bitcoindClient.unloadWallet({ walletName: "outside" })
})

describe("UserWallet - getOnchainFee", () => {
  it("returns a fee greater than zero for an external address", async () => {
    const address = (await bitcoindOutside.getNewAddress()) as OnChainAddress
    const fee = await Wallets.getOnChainFee({
      wallet: wallet0,
      amount: defaultAmount,
      address,
      targetConfirmations: defaultTarget,
    })
    expect(fee).not.toBeInstanceOf(Error)
    expect(fee).toBeGreaterThan(0)

    const wallet = await WalletsRepository().findById(wallet0.id)
    if (wallet instanceof Error) throw wallet

    const account = await AccountsRepository().findById(wallet.accountId)
    if (account instanceof Error) throw account

    expect(fee).toBeGreaterThan(account.withdrawFee)
  })

  it("returns zero for an on us address", async () => {
    const address = await Wallets.createOnChainAddress(wallet1.id)
    if (address instanceof Error) throw address
    const fee = await Wallets.getOnChainFee({
      wallet: wallet0,
      amount: defaultAmount,
      address,
      targetConfirmations: defaultTarget,
    })
    expect(fee).not.toBeInstanceOf(Error)
    expect(fee).toBe(0)
  })

  it("returns error for dust amount", async () => {
    const address = (await bitcoindOutside.getNewAddress()) as OnChainAddress
    const amount = toSats(dustThreshold - 1)
    const fee = await Wallets.getOnChainFee({
      wallet: wallet0,
      amount,
      address,
      targetConfirmations: defaultTarget,
    })
    expect(fee).toBeInstanceOf(LessThanDustThresholdError)
    expect(fee).toHaveProperty(
      "message",
      `Use lightning to send amounts less than ${dustThreshold}`,
    )
  })

  it("returns error for balance too low", async () => {
    const address = (await bitcoindOutside.getNewAddress()) as OnChainAddress
    const amount = toSats(1000000000)
    const fee = await Wallets.getOnChainFee({
      wallet: wallet0,
      amount,
      address,
      targetConfirmations: defaultTarget,
    })
    expect(fee).toBeInstanceOf(InsufficientBalanceError)
    expect(fee).toHaveProperty("message", "Balance is too low")
  })
})
