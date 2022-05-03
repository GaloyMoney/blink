import { User } from "@services/mongoose/schema"
import { getAccountsConfig } from "@config"

describe("New Account", () => {
  it("uses the default account status", async () => {
    const user = new User()
    await user.save()
    expect(user.statusHistory).toEqual({
      status: getAccountsConfig().initialStatus,
      comment: "Initial Status",
    })
  })
})
