import { Users, Accounts } from "@app"

import { createUserAndWalletFromUserRef, getUserIdByTestUserRef } from "test/helpers"

describe("Users - role", () => {
  it("persists a role set in test accounts", async () => {
    await createUserAndWalletFromUserRef("I")
    const userId = await getUserIdByTestUserRef("I")
    const user = await Users.getUser(userId)
    if (user instanceof Error) throw new Error("missing user")
    const account = await Accounts.getAccount(user.defaultAccountId)
    expect(account).not.toBeInstanceOf(Error)
    if (account instanceof Error) throw user
    expect(account.isEditor).toEqual(true)
  })
})
