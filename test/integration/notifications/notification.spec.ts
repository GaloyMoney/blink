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
    allTxBaseVolumeSince: async () => ({
      outgoingBaseAmount: toSats(10_000),
      incomingBaseAmount: toSats(10_000),
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

        const expectedUsdBalance = (price * balance).toLocaleString("en", localeOpts)
        const expectedSatsBalance = balance.toLocaleString("en", localeOpts)

        expect(call.title).toBe(
          `Your balance is $${expectedUsdBalance} (${expectedSatsBalance} sats)`,
        )
      }
    })
  })
})
