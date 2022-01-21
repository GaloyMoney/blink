import { WalletCurrency, WalletType, PaymentInputValidator } from "@domain/wallets"
import { AccountLevel, AccountStatus } from "@domain/accounts"

describe("PaymentInputValidator", () => {
  const dummySenderWallet: Wallet = {
    id: "senderWalletId" as WalletId,
    accountId: "senderAccountId" as AccountId,
    type: WalletType.Checking,
    currency: WalletCurrency.Btc,
    onChainAddressIdentifiers: [],
    onChainAddresses: () => [],
  }
  const dummyRecipientWallet: Wallet = {
    id: "recipientWalletId" as WalletId,
    accountId: "recipientAccountId" as AccountId,
    type: WalletType.Checking,
    currency: WalletCurrency.Btc,
    onChainAddressIdentifiers: [],
    onChainAddresses: () => [],
  }
  const dummyAccount: Account = {
    id: "senderAccountId" as AccountId,
    createdAt: new Date(),
    username: "username" as Username,
    defaultWalletId: "senderWalletId" as WalletId,
    ownerId: "ownerId" as UserId,
    depositFeeRatio: 0 as DepositFeeRatio,
    withdrawFee: 0 as WithdrawFee,
    level: AccountLevel.One,
    status: AccountStatus.Active,
    title: "" as BusinessMapTitle,
    coordinates: {
      latitude: 0,
      longitude: 0,
    },
    contacts: [],
  }

  it("returns the correct types when everything is valid", async () => {
    const getWalletFn: PaymentInputValidatorConfig = (walletId: WalletId) => {
      const wallet = {
        senderWalletId: dummySenderWallet,
        recipientWalletId: dummyRecipientWallet,
      }[walletId]

      return Promise.resolve(wallet)
    }

    const validator: PaymentInputValidator = PaymentInputValidator(getWalletFn)
    const result = await validator.validatePaymentInput({
      amount: 2,
      senderWalletId: "senderWalletId",
      senderAccount: dummyAccount,
      recipientWalletId: "recipientWalletId",
    })
    if (result instanceof Error) throw result
    const { amount, senderWallet } = result
    expect(amount).toBe(2)
    expect(senderWallet).toBe(dummySenderWallet)
  })

  it("Fails on invalid amount", async () => {
    const getWalletFn: PaymentInputValidatorConfig = (walletId: WalletId) => {
      const wallet = {
        senderWalletId: dummySenderWallet,
        recipientWalletId: dummyRecipientWallet,
      }[walletId]

      return Promise.resolve(wallet)
    }

    const validator: PaymentInputValidator = PaymentInputValidator(getWalletFn)
    const result = await validator.validatePaymentInput({
      amount: -1,
      senderWalletId: "senderWalletId",
      senderAccount: dummyAccount,
      recipientWalletId: "recipientWalletId",
    })
    expect(result instanceof Error).toBe(true)
  })

  it("Fails when sender === recipient", async () => {
    const getWalletFn: PaymentInputValidatorConfig = (walletId: WalletId) => {
      const wallet = {
        senderWalletId: dummySenderWallet,
        recipientWalletId: dummyRecipientWallet,
      }[walletId]

      return Promise.resolve(wallet)
    }

    const validator: PaymentInputValidator = PaymentInputValidator(getWalletFn)
    const result = await validator.validatePaymentInput({
      amount: 2,
      senderWalletId: "senderWalletId",
      senderAccount: dummyAccount,
      recipientWalletId: "senderWalletId",
    })
    expect(result instanceof Error).toBe(true)
  })

  it("Fails if the account is not active", async () => {
    const getWalletFn: PaymentInputValidatorConfig = (walletId: WalletId) => {
      const wallet = {
        senderWalletId: dummySenderWallet,
        recipientWalletId: dummyRecipientWallet,
      }[walletId]

      return Promise.resolve(wallet)
    }

    const validator: PaymentInputValidator = PaymentInputValidator(getWalletFn)
    const result = await validator.validatePaymentInput({
      amount: 2,
      senderWalletId: "senderWalletId",
      senderAccount: {
        ...dummyAccount,
        status: AccountStatus.Locked,
      },
      recipientWalletId: "recipientWalletId",
    })
    expect(result instanceof Error).toBe(true)
  })

  it("Returns null for recipient when id is null", async () => {
    const getWalletFn: PaymentInputValidatorConfig = (walletId: WalletId) => {
      const wallet = {
        senderWalletId: dummySenderWallet,
        recipientWalletId: dummyRecipientWallet,
      }[walletId]

      return Promise.resolve(wallet)
    }

    const validator: PaymentInputValidator = PaymentInputValidator(getWalletFn)
    const result = await validator.validatePaymentInput({
      amount: 2,
      senderWalletId: "senderWalletId",
      senderAccount: dummyAccount,
      recipientWalletId: null,
    })
    if (result instanceof Error) throw result
    const { recipientWallet } = result
    expect(recipientWallet).toBe(null)
  })
})
