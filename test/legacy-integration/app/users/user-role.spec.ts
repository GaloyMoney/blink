import { AccountsRepository } from "@services/mongoose"

import { createUserAndWalletFromPhone, getUserIdByPhone } from "test/helpers"

describe("Users - role", () => {
  it("persists a role set in test accounts", async () => {
    const phone = "+16505554336" as PhoneNumber
    await createUserAndWalletFromPhone(phone)
    const userId = await getUserIdByPhone(phone)
    const account = await AccountsRepository().findByUserId(userId)
    expect(account).not.toBeInstanceOf(Error)
    if (account instanceof Error) throw account
    expect(account.isEditor).toEqual(true)
  })
})
