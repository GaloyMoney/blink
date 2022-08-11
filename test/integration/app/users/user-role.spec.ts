import { Users } from "@app"

import { createUserAndWalletFromUserRef, getUserIdByTestUserRef } from "test/helpers"

describe("Users - role", () => {
  it("persists a role set in test accounts", async () => {
    await createUserAndWalletFromUserRef("I")
    const userId = await getUserIdByTestUserRef("I")
    const user = await Users.getUser(userId)
    expect(user).not.toBeInstanceOf(Error)
    if (user instanceof Error) throw user
    expect(user.isEditor).toEqual(true)
  })
})
