import { customerPath } from "src/ledger/ledger"
import { baseLogger } from "src/logger"
import { User } from "src/schema"
import { getFunderWallet } from "src/walletFactory"
import { getUserWallet } from "test/helpers"

jest.mock("src/realtimePrice", () => require("test/mocks/realtimePrice"))

describe("schema", () => {
  describe("User", () => {
    describe("getActiveUsers", () => {
      it("returns active users according to volume", async () => {
        await getUserWallet(8)

        const date = Date.now() + 31 * 24 * 60 * 60 * 1000
        let spy = jest
          .spyOn(User, "getVolume")
          .mockImplementation(() => ({ outgoingSats: 50000, incomingSats: 100000 }))

        const activeUsers = await User.getActiveUsers()
        spy.mockClear()

        const accountPaths = activeUsers.map((user) => customerPath(user._id))
        const userWallet0AccountPath = (await getUserWallet(0)).user.accountPath
        const funderWalletAccountPath = (await getFunderWallet({ logger: baseLogger }))
          .user.accountPath

        // userWallets used in the tests
        expect(accountPaths.length).toBeGreaterThan(0)
        expect(accountPaths.indexOf(userWallet0AccountPath)).toBeGreaterThan(-1)
        expect(accountPaths.indexOf(funderWalletAccountPath)).toBeGreaterThan(-1)

        spy = jest
          .spyOn(User, "getVolume")
          .mockImplementation(() => ({ outgoingSats: 0, incomingSats: 0 }))
        const finalNumActiveUsers = (await User.getActiveUsers()).length
        spy.mockClear()

        expect(finalNumActiveUsers).toBe(0)
      })
    })
  })
})
