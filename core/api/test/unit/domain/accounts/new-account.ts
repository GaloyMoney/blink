import { Account } from "@/services/mongoose/schema"
import { getDefaultAccountsConfig } from "@/config"

describe("New Account", () => {
  it("uses the default account status", async () => {
    const account = new Account()
    await account.save()
    expect(account.statusHistory).toEqual({
      status: getDefaultAccountsConfig().initialStatus,
      comment: "Initial Status",
    })
  })
})
