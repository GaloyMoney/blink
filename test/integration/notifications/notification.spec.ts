import { getDisplayCurrencyConfig } from "@config"
import { Prices } from "@app"
import { getRecentlyActiveAccounts } from "@app/accounts/active-accounts"
import { sendDefaultWalletBalanceToUsers } from "@app/accounts/send-default-wallet-balance-to-users"
import { toSats } from "@domain/bitcoin"
import * as serviceLedger from "@services/ledger"
import { LedgerService } from "@services/ledger"
import { createPushNotificationContent } from "@services/notifications/create-push-notification-content"
import * as PushNotificationsServiceImpl from "@services/notifications/push-notifications"
import { UsersRepository, WalletsRepository } from "@services/mongoose"

jest.mock("@app/prices/get-current-price", () => require("test/mocks/get-current-price"))

const { code: DefaultDisplayCurrency } = getDisplayCurrencyConfig()

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
      const sendNotification = jest.fn()
      jest
        .spyOn(PushNotificationsServiceImpl, "PushNotificationsService")
        .mockImplementation(() => ({ sendNotification }))

      await sendDefaultWalletBalanceToUsers()
      const activeAccounts = await getRecentlyActiveAccounts()
      if (activeAccounts instanceof Error) throw activeAccounts

      expect(activeAccounts.length).toBeGreaterThan(0)
      expect(sendNotification.mock.calls.length).toBeGreaterThan(0)

      let usersWithDeviceTokens = 0
      for (const { ownerId } of activeAccounts) {
        const user = await UsersRepository().findById(ownerId)
        if (user instanceof Error) throw user

        if (user.deviceTokens && user.deviceTokens.length > 0) usersWithDeviceTokens++
      }

      expect(sendNotification.mock.calls.length).toBe(usersWithDeviceTokens)

      for (let i = 0; i < sendNotification.mock.calls.length; i++) {
        const [call] = sendNotification.mock.calls[i]
        const { defaultWalletId, ownerId } = activeAccounts[i]

        const user = await UsersRepository().findById(ownerId)
        if (user instanceof Error) throw user

        const wallet = await WalletsRepository().findById(defaultWalletId)
        if (wallet instanceof Error) throw wallet

        const balance = await LedgerService().getWalletBalance(defaultWalletId)
        if (balance instanceof Error) throw balance

        const paymentAmount = { amount: BigInt(balance), currency: wallet.currency }
        const displayPaymentAmount = {
          amount: balance * price,
          currency: DefaultDisplayCurrency,
        }

        const { title, body } = createPushNotificationContent({
          type: "balance",
          userLanguage: user.language,
          amount: paymentAmount,
          displayAmount: displayPaymentAmount,
        })

        expect(call.title).toBe(title)
        expect(call.body).toBe(body)
      }
    })
  })
})
