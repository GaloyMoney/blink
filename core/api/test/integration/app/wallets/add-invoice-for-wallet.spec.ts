import { randomUUID } from "crypto"

import { Accounts, Wallets } from "@/app"

import { AccountStatus } from "@/domain/accounts"
import { InactiveAccountError } from "@/domain/errors"

import { AccountsRepository } from "@/services/mongoose"

import { createRandomUserAndBtcWallet } from "test/helpers"

describe("addInvoice", () => {
  it("fails for self if account is locked", async () => {
    const newWalletDescriptor = await createRandomUserAndBtcWallet()
    const newAccount = await AccountsRepository().findById(newWalletDescriptor.accountId)
    if (newAccount instanceof Error) throw newAccount

    const updatedByPrivilegedClientId = randomUUID() as PrivilegedClientId

    // Lock account
    const updatedAccount = await Accounts.updateAccountStatus({
      accountId: newAccount.id,
      status: AccountStatus.Locked,
      updatedByPrivilegedClientId,
    })
    if (updatedAccount instanceof Error) throw updatedAccount
    expect(updatedAccount.status).toEqual(AccountStatus.Locked)

    // Add invoice for self attempt
    const selfRes = await Wallets.addInvoiceNoAmountForSelf({
      walletId: newWalletDescriptor.id,
    })
    expect(selfRes).toBeInstanceOf(InactiveAccountError)

    // Create invoice for recipient attempt
    const recipientRes = await Wallets.addInvoiceNoAmountForRecipient({
      recipientWalletId: newWalletDescriptor.id,
    })
    expect(recipientRes).toBeInstanceOf(InactiveAccountError)
  })
})
