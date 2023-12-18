import { checkedToUsername } from "@/domain/accounts"
import { AccountsRepository } from "@/services/mongoose"
import { createRandomUserAndBtcWallet } from "test/helpers"

const randomUsername = () => {
  const num = Math.floor(Math.random() * 10 ** 4)
  const username = checkedToUsername(`alice${num}`)
  if (username instanceof Error) throw username
  return username
}

const accounts = AccountsRepository()
describe("AccountsRepository", () => {
  describe("findByUsername", () => {
    it("returns valid account for username", async () => {
      const username = randomUsername()

      // Create user
      const newWalletDescriptor = await createRandomUserAndBtcWallet()
      const newAccount = await AccountsRepository().findById(
        newWalletDescriptor.accountId,
      )
      if (newAccount instanceof Error) throw newAccount

      // Set username
      newAccount.username = username
      const res = await accounts.update(newAccount)
      expect(res).not.toBeInstanceOf(Error)

      // Check that username was set
      const account = await accounts.findByUsername(username)
      if (account instanceof Error) throw account
      expect(account.id).toStrictEqual(newAccount.id)
    })

    it("returns valid account for other capitalization", async () => {
      const username = randomUsername()

      // Create user
      const newWalletDescriptor = await createRandomUserAndBtcWallet()
      const newAccount = await AccountsRepository().findById(
        newWalletDescriptor.accountId,
      )
      if (newAccount instanceof Error) throw newAccount

      // Set username
      newAccount.username = username
      const res = await accounts.update(newAccount)
      expect(res).not.toBeInstanceOf(Error)

      // Check that username query is case insensitive
      const account = await accounts.findByUsername(
        username.toLocaleUpperCase() as Username,
      )
      if (account instanceof Error) throw account
      expect(account.id).toStrictEqual(newAccount.id)
    })

    it("errors if username does not exist", async () => {
      const username = checkedToUsername("non_user")
      if (username instanceof Error) throw username

      const account = await accounts.findByUsername(username)
      expect(account).toBeInstanceOf(Error)
    })
  })
})
