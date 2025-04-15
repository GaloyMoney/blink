import { AccountValidator } from "@/domain/accounts/account-validator"
import { InactiveAccountError, InvalidWalletId } from "@/domain/errors"
import { AccountStatus, AccountLevel } from "@/domain/accounts/primitives"
import { UsdDisplayCurrency } from "@/domain/fiat/primitives"
import { WalletType } from "@/domain/wallets/primitives"
import { WalletCurrency } from "@/domain/shared/primitives"

describe("AccountValidator", () => {
  const baseAccountProps = {
    createdAt: new Date(),
    defaultWalletId: "wallet-id-1" as WalletId,
    withdrawFee: 100 as Satoshis,
    level: AccountLevel.One,
    contactEnabled: true,
    contacts: [],
    kratosUserId: "kratos-id-1" as UserId,
    displayCurrency: UsdDisplayCurrency,
    statusHistory: [],
  }

  it("returns validator object for active account", () => {
    const validAccount = {
      ...baseAccountProps,
      id: "account-id-1" as AccountId,
      status: AccountStatus.Active,
    }

    const result = AccountValidator(validAccount)
    expect(result).not.toBeInstanceOf(Error)
    expect(result).toHaveProperty("validateWalletForAccount")
  })

  it("returns validator object for invited account", () => {
    const invitedAccount = {
      ...baseAccountProps,
      id: "account-id-2" as AccountId,
      status: AccountStatus.Invited,
    }

    const result = AccountValidator(invitedAccount)
    expect(result).not.toBeInstanceOf(Error)
    expect(result).toHaveProperty("validateWalletForAccount")
  })

  it("returns error if account status is not active or invited", () => {
    const inactiveAccount = {
      ...baseAccountProps,
      id: "account-id-3" as AccountId,
      status: AccountStatus.Locked,
    }

    const result = AccountValidator(inactiveAccount)
    expect(result).toBeInstanceOf(InactiveAccountError)
    expect(result).toHaveProperty("message", "account-id-3")
  })

  it("returns true if wallet.accountId matches account.id", () => {
    const validAccount = {
      ...baseAccountProps,
      id: "account-id-1" as AccountId,
      status: AccountStatus.Active,
    }

    const validWallet = {
      id: "wallet-id-1" as WalletId,
      accountId: "account-id-1" as AccountId,
      currency: WalletCurrency.Btc,
      type: WalletType.Checking,
      onChainAddressIdentifiers: [],
      onChainAddresses: () => [],
    } as Wallet

    const validator = AccountValidator(validAccount)
    if (validator instanceof Error) throw validator

    const result = validator.validateWalletForAccount(validWallet)
    expect(result).toBe(true)
  })

  it("returns InvalidWalletId error if wallet.accountId does not match account.id", () => {
    const validAccount = {
      ...baseAccountProps,
      id: "account-id-1" as AccountId,
      status: AccountStatus.Active,
    }

    const invalidWallet = {
      id: "wallet-id-1" as WalletId,
      accountId: "wrong-account-id" as AccountId,
      currency: WalletCurrency.Btc,
      type: WalletType.Checking,
      onChainAddressIdentifiers: [],
      onChainAddresses: () => [],
    } as Wallet

    const validator = AccountValidator(validAccount)
    if (validator instanceof Error) throw validator

    const result = validator.validateWalletForAccount(invalidWallet)
    expect(result).toBeInstanceOf(InvalidWalletId)
    expect(result).toHaveProperty("message")
  })
})
