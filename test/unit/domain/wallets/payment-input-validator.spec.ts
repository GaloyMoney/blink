import crypto from "crypto"

import {
  InvalidSatoshiAmount,
  InvalidAccountStatusError,
  SelfPaymentError,
} from "@domain/errors"
import { WalletCurrency, WalletType, PaymentInputValidator } from "@domain/wallets"
import { AccountLevel, AccountStatus } from "@domain/accounts"

describe("PaymentInputValidator", () => {
  const dummyAccount: Account = {
    id: crypto.randomUUID() as AccountId,
    createdAt: new Date(),
    username: "username" as Username,
    defaultWalletId: "senderWalletId" as WalletId,
    ownerId: "ownerId" as UserId,
    depositFeeRatio: 0 as DepositFeeRatio,
    withdrawFee: 0 as Satoshis,
    level: AccountLevel.One,
    status: AccountStatus.Active,
    title: "" as BusinessMapTitle,
    coordinates: {
      latitude: 0,
      longitude: 0,
    },
    contacts: [],
  }

  const dummySenderWallet: Wallet = {
    id: crypto.randomUUID() as WalletId,
    accountId: dummyAccount.id,
    type: WalletType.Checking,
    currency: WalletCurrency.Btc,
    onChainAddressIdentifiers: [],
    onChainAddresses: () => [],
  }

  const dummyRecipientWallet: Wallet = {
    id: crypto.randomUUID() as WalletId,
    accountId: crypto.randomUUID() as AccountId,
    type: WalletType.Checking,
    currency: WalletCurrency.Btc,
    onChainAddressIdentifiers: [],
    onChainAddresses: () => [],
  }

  const wallets: { [key: WalletId]: Wallet } = {}
  wallets[dummySenderWallet.id] = dummySenderWallet
  wallets[dummyRecipientWallet.id] = dummyRecipientWallet

  const getWalletFn: PaymentInputValidatorConfig = (walletId: WalletId) => {
    return Promise.resolve(wallets[walletId])
  }

  it("returns the correct types when everything is valid", async () => {
    const validator: PaymentInputValidator = PaymentInputValidator(getWalletFn)
    const result = await validator.validateSender({
      amount: 2,
      senderWalletId: dummySenderWallet.id,
      senderAccount: dummyAccount,
    })
    if (result instanceof Error) throw result

    const { amount, senderWallet } = result
    expect(amount).toBe(2)
    expect(senderWallet).toEqual(expect.objectContaining(dummySenderWallet))

    const recipient = await validator.validateRecipient({
      senderWallet,
      recipientWalletId: dummyRecipientWallet.id,
    })
    if (recipient instanceof Error) throw recipient
    const { recipientWallet } = recipient

    expect(recipientWallet).toEqual(expect.objectContaining(dummyRecipientWallet))
  })

  it("Fails on invalid amount", async () => {
    const validator: PaymentInputValidator = PaymentInputValidator(getWalletFn)
    const result = await validator.validateSender({
      amount: -1,
      senderWalletId: dummySenderWallet.id,
      senderAccount: dummyAccount,
    })
    expect(result).toBeInstanceOf(InvalidSatoshiAmount)
  })

  it("Fails when sender === recipient", async () => {
    const validator: PaymentInputValidator = PaymentInputValidator(getWalletFn)
    const result = await validator.validateSender({
      amount: 2,
      senderWalletId: dummySenderWallet.id,
      senderAccount: dummyAccount,
    })
    if (result instanceof Error) throw result
    const { senderWallet } = result
    const recipient = await validator.validateRecipient({
      senderWallet,
      recipientWalletId: dummySenderWallet.id,
    })
    expect(recipient).toBeInstanceOf(SelfPaymentError)
  })

  it("Fails if the account is not active", async () => {
    const validator: PaymentInputValidator = PaymentInputValidator(getWalletFn)
    const result = await validator.validateSender({
      amount: 2,
      senderWalletId: dummySenderWallet.id,
      senderAccount: {
        ...dummyAccount,
        status: AccountStatus.Locked,
      },
    })
    expect(result).toBeInstanceOf(InvalidAccountStatusError)
  })

  it("Returns undefined for recipient when id is undefined", async () => {
    const validator: PaymentInputValidator = PaymentInputValidator(getWalletFn)
    const result = await validator.validateSender({
      amount: 2,
      senderWalletId: dummySenderWallet.id,
      senderAccount: dummyAccount,
    })
    if (result instanceof Error) throw result

    const { senderWallet, amount } = result
    expect(amount).toBe(2)
    expect(senderWallet).toEqual(expect.objectContaining(dummySenderWallet))
  })
})
