import { randomUUID } from "crypto"

import { Accounts } from "@/app"

import { AccountsRepository } from "@/services/mongoose"
import { createRandomUserAndBtcWallet } from "test/helpers"

describe("updateAccountStatus", () => {
  it("sets account status (with history) for given user id", async () => {
    const newWalletDescriptor = await createRandomUserAndBtcWallet()
    const newAccount = await AccountsRepository().findById(newWalletDescriptor.accountId)
    if (newAccount instanceof Error) throw newAccount

    const updatedByPrivilegedClientId = randomUUID() as PrivilegedClientId

    let account = await Accounts.updateAccountStatus({
      accountId: newAccount.id,
      status: "pending",
      updatedByPrivilegedClientId,
    })
    if (account instanceof Error) {
      throw account
    }
    expect(account.status).toEqual("pending")

    account = await Accounts.updateAccountStatus({
      accountId: newAccount.id,
      status: "locked",
      updatedByPrivilegedClientId,
      comment: "Looks spammy",
    })
    if (account instanceof Error) {
      throw account
    }
    expect(account.statusHistory.slice(-1)[0]).toMatchObject({
      status: "locked",
      updatedByPrivilegedClientId,
      comment: "Looks spammy",
    })
    expect(account.status).toEqual("locked")

    account = await Accounts.updateAccountStatus({
      accountId: newAccount.id,
      status: "active",
      updatedByPrivilegedClientId,
    })
    if (account instanceof Error) {
      throw account
    }
    expect(account.statusHistory.length).toBe(4)
    expect(account.status).toEqual("active")
  })
})
