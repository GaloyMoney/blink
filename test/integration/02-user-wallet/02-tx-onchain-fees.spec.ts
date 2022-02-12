import { Wallets } from "@app"
import { getOnChainWalletConfig } from "@config"
import { toSats, toTargetConfs } from "@domain/bitcoin"
import { InsufficientBalanceError, LessThanDustThresholdError } from "@domain/errors"
import { AccountsRepository, WalletsRepository } from "@services/mongoose"

import {
  bitcoindClient,
  bitcoindOutside,
  createUserAndWalletFromUserRef,
  getAccountByTestUserRef,
  getDefaultWalletIdByTestUserRef,
} from "test/helpers"

const defaultAmount = toSats(6000)
const defaultTarget = toTargetConfs(3)
const { dustThreshold } = getOnChainWalletConfig()
let walletIdA: WalletId, walletIdB: WalletId, accountA: Account

beforeAll(async () => {
  await bitcoindClient.loadWallet({ filename: "outside" })

  await createUserAndWalletFromUserRef("A")
  await createUserAndWalletFromUserRef("B")

  walletIdA = await getDefaultWalletIdByTestUserRef("A")
  accountA = await getAccountByTestUserRef("A")
  walletIdB = await getDefaultWalletIdByTestUserRef("B")
})

afterAll(async () => {
  await bitcoindClient.unloadWallet({ walletName: "outside" })
})

describe("UserWallet - getOnchainFee", () => {
  it("returns a fee greater than zero for an external address", async () => {
    const address = (await bitcoindOutside.getNewAddress()) as OnChainAddress
    const fee = await Wallets.getOnChainFee({
      walletId: walletIdA,
      account: accountA,
      amount: defaultAmount,
      address,
      targetConfirmations: defaultTarget,
    })
    expect(fee).not.toBeInstanceOf(Error)
    expect(fee).toBeGreaterThan(0)

    const wallet = await WalletsRepository().findById(walletIdA)
    if (wallet instanceof Error) throw wallet

    const account = await AccountsRepository().findById(wallet.accountId)
    if (account instanceof Error) throw account

    expect(fee).toBeGreaterThan(account.withdrawFee)
  })

  it("returns zero for an on us address", async () => {
    const address = await Wallets.createOnChainAddress(walletIdB)
    if (address instanceof Error) throw address
    const fee = await Wallets.getOnChainFee({
      walletId: walletIdA,
      account: accountA,
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
      walletId: walletIdA,
      account: accountA,
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
    const amount = toSats(1_000_000_000)
    const fee = await Wallets.getOnChainFee({
      walletId: walletIdA,
      account: accountA,
      amount,
      address,
      targetConfirmations: defaultTarget,
    })
    expect(fee).toBeInstanceOf(InsufficientBalanceError)
    expect(fee).toHaveProperty("message", "Balance is too low")
  })
})
