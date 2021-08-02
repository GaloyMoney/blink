import { getCurrentPrice } from "@services/realtime-price"
import { sendBalanceToUsers } from "@servers/daily-balance-notification"
import { User } from "@services/mongoose/schema"
import { ledger } from "@services/mongodb"
jest.mock("@core/notifications/notification")
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { sendNotification } = require("@core/notifications/notification")

jest.mock("@services/realtime-price", () => require("test/mocks/realtime-price"))

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
        const balance = await ledger.getAccountBalance(call.user.accountPath)

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
