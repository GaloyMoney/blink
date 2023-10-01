import { randomUUID } from "crypto"

import { Accounts, Wallets } from "@app"

import { AccountStatus } from "@domain/accounts"
import { InactiveAccountError } from "@domain/errors"

import { AccountsRepository } from "@services/mongoose"

import { createRandomUserAndBtcWallet } from "test/helpers"

const updatedByAuditorId = randomUUID() as AuditorId

describe("onChainAddress", () => {
  it("fails if account is locked", async () => {
    const newWalletDescriptor = await createRandomUserAndBtcWallet()
    const newAccount = await AccountsRepository().findById(newWalletDescriptor.accountId)
    if (newAccount instanceof Error) throw newAccount

    // Lock account
    const updatedAccount = await Accounts.updateAccountStatus({
      id: newAccount.id,
      status: AccountStatus.Locked,
      updatedByAuditorId,
    })
    if (updatedAccount instanceof Error) throw updatedAccount
    expect(updatedAccount.status).toEqual(AccountStatus.Locked)

    // Create address attempt
    const res = await Wallets.getLastOnChainAddress(newWalletDescriptor.id)
    expect(res).toBeInstanceOf(InactiveAccountError)
  })
})
