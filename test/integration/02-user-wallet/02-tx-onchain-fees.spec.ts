import * as Wallets from "@app/wallets"
import { getOnChainWalletConfig } from "@config/app"
import { InsufficientBalanceError, LessThanDustThresholdError } from "@domain/errors"
import { bitcoindClient, bitcoindOutside, getUserWallet } from "test/helpers"

jest.mock("@services/realtime-price", () => require("test/mocks/realtime-price"))
jest.mock("@services/phone-provider", () => require("test/mocks/phone-provider"))

const defaultAmount = 6000 as Satoshis
const defaultTarget = 3 as TargetConfirmations
const { dustThreshold } = getOnChainWalletConfig()
let userWallet0: Wallet, userWallet1: Wallet

const getWallet = async (testWallet: number): Promise<Wallet> => {
  const userWallet = await getUserWallet(testWallet)
  const wallet = await Wallets.getWallet(userWallet.user.id)
  if (wallet instanceof Error) throw wallet
  return wallet
}

beforeAll(async () => {
  userWallet0 = await getWallet(0)
  userWallet1 = await getWallet(1)
  await bitcoindClient.loadWallet({ filename: "outside" })
})

afterAll(async () => {
  await bitcoindClient.unloadWallet({ wallet_name: "outside" })
})

describe("UserWallet - getOnchainFee", () => {
  it("returns a fee greater than zero for an external address", async () => {
    const address = (await bitcoindOutside.getNewAddress()) as OnChainAddress
    const fee = await Wallets.getOnChainFee({
      wallet: userWallet0,
      amount: defaultAmount,
      address,
      targetConfirmations: defaultTarget,
    })
    expect(fee).toBeGreaterThan(0)
    expect(fee).toBeGreaterThan(userWallet0.withdrawFee)
  })

  it("returns zero for an on us address", async () => {
    const address = await Wallets.createOnChainAddress(userWallet1.id)
    if (address instanceof Error) throw address
    const fee = await Wallets.getOnChainFee({
      wallet: userWallet0,
      amount: defaultAmount,
      address,
      targetConfirmations: defaultTarget,
    })
    expect(fee).toBe(0)
  })

  it("returns error for dust amount", async () => {
    const address = (await bitcoindOutside.getNewAddress()) as OnChainAddress
    const amount = (dustThreshold - 1) as Satoshis
    const fee = await Wallets.getOnChainFee({
      wallet: userWallet0,
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
    const amount = 1000000000 as Satoshis
    const fee = await Wallets.getOnChainFee({
      wallet: userWallet0,
      amount,
      address,
      targetConfirmations: defaultTarget,
    })
    expect(fee).toBeInstanceOf(InsufficientBalanceError)
    expect(fee).toHaveProperty("message", "Balance is too low")
  })
})
