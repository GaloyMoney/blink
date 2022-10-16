import { AccountsRepository } from "@services/mongoose"

import { createUserAndWalletFromUserRef, getUserIdByTestUserRef } from "test/helpers"

describe("Users - role", () => {
  it("persists a role set in test accounts", async () => {
    await createUserAndWalletFromUserRef("I")
    const userId = await getUserIdByTestUserRef("I")
    const account = await AccountsRepository().findByKratosUserId(userId)
    expect(account).not.toBeInstanceOf(Error)
    if (account instanceof Error) throw account
    expect(account.isEditor).toEqual(true)
  })
})
