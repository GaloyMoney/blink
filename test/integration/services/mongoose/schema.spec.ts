import { User } from "@services/mongoose/schema"
import { getUserWallet } from "test/helpers"

jest.mock("@services/realtime-price", () => require("test/mocks/realtime-price"))
jest.mock("@services/phone-provider", () => require("test/mocks/phone-provider"))

describe("schema", () => {
  describe("User", () => {
    describe("getActiveUsers", () => {
      it("returns active users according to volume", async () => {
        await getUserWallet(8)

        let spy = jest
          .spyOn(User, "getVolume")
          .mockImplementation(() => ({ outgoingSats: 50000, incomingSats: 100000 }))

        const activeUsers = await User.getActiveUsers()
        spy.mockClear()

        const accountIds = activeUsers.map((user) => user._id)
        const userWallet0AccountId = (await getUserWallet(0)).user._id
        const funderWalletAccountId = (await User.findOne({ role: "funder" }))._id

        // userWallets used in the tests
        expect(accountIds).toEqual(
          expect.arrayContaining([userWallet0AccountId, funderWalletAccountId]),
        )

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
