import { Prices } from "@app"
import { getRecentlyActiveAccounts } from "@app/accounts/active-accounts"
import { sendDefaultWalletBalanceToUsers } from "@app/accounts/send-default-wallet-balance-to-users"
import { toSats } from "@domain/bitcoin"
import * as serviceLedger from "@services/ledger"
import { baseLogger } from "@services/logger"
import { LedgerService } from "@services/ledger"

jest.mock("@services/notifications/notification")
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { sendNotification } = require("@services/notifications/notification")

let price, spy

beforeAll(async () => {
  price = await Prices.getCurrentPrice()
  if (price instanceof Error) throw price

  const ledgerService = serviceLedger.LedgerService()

  spy = jest.spyOn(serviceLedger, "LedgerService").mockImplementation(() => ({
    ...ledgerService,
    allTxVolumeSince: async () => ({
      outgoingSats: toSats(1000),
      incomingSats: toSats(1000),
    }),
  }))
})

afterAll(() => {
  spy.mockClear()
  // jest.restoreAllMocks()
})

describe("notification", () => {
  describe("sendNotification", () => {
    it("sends daily balance to active users", async () => {
      await sendDefaultWalletBalanceToUsers(baseLogger)
      const users = await getRecentlyActiveAccounts()
      if (users instanceof Error) throw users
      const numActiveUsers = users.length
      expect(sendNotification.mock.calls.length).toBe(numActiveUsers)
      for (const [call] of sendNotification.mock.calls) {
        const balance = await LedgerService().getWalletBalance(call.user.defaultWalletId)
        if (balance instanceof Error) throw balance

        const expectedUsdBalance = (price * balance).toLocaleString("en", {
          maximumFractionDigits: 2,
        })
        const expectedSatsBalance = balance.toLocaleString("en", {
          maximumFractionDigits: 2,
        })
        expect(call.title).toBe(
          `Your balance is $${expectedUsdBalance} (${expectedSatsBalance} sats)`,
        )
      }
    })
  })
})
