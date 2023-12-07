import { AccountsRepository } from "@/services/mongoose"

const accounts = AccountsRepository()
const username = "userA" as Username
let accountIdA: AccountId

beforeAll(async () => {
  const account = await accounts.persistNew("user-id" as UserId)
  if (account instanceof Error) throw account
  accountIdA = account.id

  account.username = username
  await accounts.update(account)
})

describe("AccountsRepository", () => {
  describe("findByUsername", () => {
    it("return true if username already exists", async () => {
      const account = await accounts.findByUsername(username)
      if (account instanceof Error) throw account
      expect(account.id).toStrictEqual(accountIdA)
    })

    it("return true for other capitalization", async () => {
      const account = await accounts.findByUsername(
        username.toLocaleUpperCase() as Username,
      )
      if (account instanceof Error) throw account
      expect(account.id).toStrictEqual(accountIdA)
    })

    it("return false if username does not exist", async () => {
      const account = await accounts.findByUsername("user" as Username)
      expect(account).toBeInstanceOf(Error)
    })
  })
})
