import crypto from "crypto"

import { UsdDisplayCurrency } from "@/domain/fiat"
import { AccountLevel, AccountStatus } from "@/domain/accounts"
import { InvalidAccountStatusError, SelfPaymentError } from "@/domain/errors"
import { PaymentInputValidator, WalletType } from "@/domain/wallets"
import { WalletCurrency, InvalidBtcPaymentAmountError } from "@/domain/shared"

describe("PaymentInputValidator", () => {
  const dummyAccount: Account = {
    id: crypto.randomUUID() as AccountId,
    createdAt: new Date(),
    username: "username" as Username,
    defaultWalletId: "senderWalletId" as WalletId,
    withdrawFee: 0 as Satoshis,
    level: AccountLevel.One,
    status: AccountStatus.Active,
    statusHistory: [{ status: AccountStatus.Active }],
    title: "" as BusinessMapTitle,
    coordinates: {
      latitude: 0,
      longitude: 0,
    },
    notificationSettings: {
      push: {
        enabled: true,
        disabledCategories: [],
      },
    },
    contactEnabled: true,
    contacts: [],
    kratosUserId: "kratosUserId" as UserId,
    displayCurrency: UsdDisplayCurrency,
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
    const result = await validator.validatePaymentInput({
      amount: 2,
      amountCurrency: WalletCurrency.Btc,
      senderWalletId: dummySenderWallet.id,
      senderAccount: dummyAccount,
      recipientWalletId: dummyRecipientWallet.id,
    })
    if (result instanceof Error) throw result

    const { amount, senderWallet, recipientWallet } = result
    expect(amount).toStrictEqual({ amount: 2n, currency: WalletCurrency.Btc })
    expect(senderWallet).toEqual(expect.objectContaining(dummySenderWallet))
    expect(recipientWallet).toEqual(expect.objectContaining(dummyRecipientWallet))
  })

  it("Fails on invalid amount", async () => {
    const validator: PaymentInputValidator = PaymentInputValidator(getWalletFn)
    const result = await validator.validatePaymentInput({
      amount: -1,
      amountCurrency: WalletCurrency.Btc,
      senderWalletId: dummySenderWallet.id,
      senderAccount: dummyAccount,
      recipientWalletId: dummyRecipientWallet.id,
    })
    expect(result).toBeInstanceOf(InvalidBtcPaymentAmountError)
  })

  it("Fails when sender === recipient", async () => {
    const validator: PaymentInputValidator = PaymentInputValidator(getWalletFn)
    const result = await validator.validatePaymentInput({
      amount: 2,
      amountCurrency: WalletCurrency.Btc,
      senderWalletId: dummySenderWallet.id,
      senderAccount: dummyAccount,
      recipientWalletId: dummySenderWallet.id,
    })
    expect(result).toBeInstanceOf(SelfPaymentError)
  })

  it("Fails if the account is not active", async () => {
    const validator: PaymentInputValidator = PaymentInputValidator(getWalletFn)
    const result = await validator.validatePaymentInput({
      amount: 2,
      amountCurrency: WalletCurrency.Btc,
      senderWalletId: dummySenderWallet.id,
      senderAccount: {
        ...dummyAccount,
        status: AccountStatus.Locked,
      },
      recipientWalletId: dummyRecipientWallet.id,
    })
    expect(result).toBeInstanceOf(InvalidAccountStatusError)
  })
})
