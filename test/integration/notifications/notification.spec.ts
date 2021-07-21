import { getCurrentPrice } from "src/realtimePrice"
import { sendBalanceToUsers } from "src/entrypoint/dailyBalanceNotification"
import { customerPath } from "src/ledger/ledger"
import { MainBook } from "src/mongodb"
import { User } from "src/schema"
jest.mock("src/notifications/notification")
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { sendNotification } = require("src/notifications/notification")

jest.mock("src/realtimePrice", () => require("test/mocks/realtimePrice"))

let price

beforeAll(async () => {
  price = await getCurrentPrice()
  jest
    .spyOn(User, "getVolume")
    .mockImplementation(() => ({ outgoingSats: 1000, incomingSats: 1000 }))
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe("notification", () => {
  describe("sendNotification", () => {
    it("sends daily balance to active users", async () => {
      await sendBalanceToUsers()
      const numActiveUsers = (await User.getActiveUsers()).length
      expect(sendNotification.mock.calls.length).toBe(numActiveUsers)
      for (const [call] of sendNotification.mock.calls) {
        const { balance } = await MainBook.balance({
          accounts: customerPath(call.user._id),
        })
        const expectedUsdBalance = (price * balance).toLocaleString("en", {
          maximumFractionDigits: 2,
        })
        const expectedSatsBalance = balance.toLocaleString("en", {
          maximumFractionDigits: 2,
        })
        expect(call.title).toBe(
          `Your balance is $${expectedUsdBalance} (${expectedSatsBalance} ${balance} sats)`,
        )
      }
    })
  })
})
