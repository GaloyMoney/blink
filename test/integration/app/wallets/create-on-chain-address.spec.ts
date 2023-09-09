import { Accounts, Wallets } from "@app"

import { AccountStatus } from "@domain/accounts"
import { InactiveAccountError } from "@domain/errors"

import { AccountsRepository } from "@services/mongoose"

import { createRandomUserAndBtcWallet } from "test/helpers"

describe("onChainAddress", () => {
  it("can apply requestId as idempotency key when creating new address", async () => {
    const newWalletDescriptor = await createRandomUserAndBtcWallet()
    const newAccount = await AccountsRepository().findById(newWalletDescriptor.accountId)
    if (newAccount instanceof Error) throw newAccount

    const requestId = ("requestId #" +
      (Math.random() * 1_000_000).toFixed()) as OnChainAddressRequestId

    const address = await Wallets.createOnChainAddress({
      walletId: newWalletDescriptor.id,
      requestId,
    })

    const retryCreateAddressWithRequestId = await Wallets.createOnChainAddress({
      walletId: newWalletDescriptor.id,
      requestId,
    })
    expect(retryCreateAddressWithRequestId).toBe(address)

    const retryCreateAddress = await Wallets.createOnChainAddress({
      walletId: newWalletDescriptor.id,
    })
    expect(retryCreateAddress).not.toBe(address)
  })

  it("fails if account is locked", async () => {
    const newWalletDescriptor = await createRandomUserAndBtcWallet()
    const newAccount = await AccountsRepository().findById(newWalletDescriptor.accountId)
    if (newAccount instanceof Error) throw newAccount

    // Lock account
    const updatedAccount = await Accounts.updateAccountStatus({
      id: newAccount.id,
      status: AccountStatus.Locked,
      updatedByUserId: newAccount.kratosUserId,
    })
    if (updatedAccount instanceof Error) throw updatedAccount
    expect(updatedAccount.status).toEqual(AccountStatus.Locked)

    // Create address attempt
    const res = await Wallets.createOnChainAddress({
      walletId: newWalletDescriptor.id,
    })
    expect(res).toBeInstanceOf(InactiveAccountError)
  })
})
