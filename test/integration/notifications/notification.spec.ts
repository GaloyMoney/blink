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

let spy

beforeAll(async () => {
  const ledgerService = serviceLedger.LedgerService()

  spy = jest.spyOn(serviceLedger, "LedgerService").mockImplementation(() => ({
    ...ledgerService,
    allTxVolumeSince: async () => ({
      outgoingSats: toSats(10_000n),
      incomingSats: toSats(10_000n),
    }),
  }))
})

afterAll(() => {
  spy.mockClear()
  // jest.restoreAllMocks()
})

describe("notification", async () => {
  const price = await Prices.getCurrentPrice()
  if (price instanceof Error) throw price

  describe("sendNotification", () => {
    it("sends daily balance to active users", async () => {
      await sendDefaultWalletBalanceToUsers(baseLogger)
      const activeAccounts = await getRecentlyActiveAccounts()
      if (activeAccounts instanceof Error) throw activeAccounts

      expect(activeAccounts.length).toBeGreaterThan(0)
      expect(sendNotification.mock.calls.length).toBeGreaterThan(0)
      expect(sendNotification.mock.calls.length).toBe(activeAccounts.length)

      const localeOpts = { maximumFractionDigits: 2 }

      for (let i = 0; i < activeAccounts.length; i++) {
        const [call] = sendNotification.mock.calls[i]
        const { id, defaultWalletId } = activeAccounts[i]
        expect(id).toBe(call.user.defaultAccountId)

        const balance = await LedgerService().getWalletBalance(defaultWalletId)
        if (balance instanceof Error) throw balance

        const displayCurrencyBalance = (price * Number(balance)).toLocaleString(
          "en",
          localeOpts,
        )
        const satsBalance = balance.toLocaleString("en")

        expect(call.title).toBe(
          `Your balance is $${displayCurrencyBalance} (${satsBalance} sats)`,
        )
      }
    })
  })
})
