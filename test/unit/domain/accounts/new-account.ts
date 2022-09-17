import { User } from "@services/mongoose/schema"
import { getDefaultAccountsConfig } from "@config"

describe("New Account", () => {
  it("uses the default account status", async () => {
    const user = new User()
    await user.save()
    expect(user.statusHistory).toEqual({
      status: getDefaultAccountsConfig().initialStatus,
      comment: "Initial Status",
    })
  })
})
