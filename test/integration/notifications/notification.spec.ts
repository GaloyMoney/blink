import { Prices } from "@app"
import { getRecentlyActiveAccounts } from "@app/accounts/active-accounts"
import { sendDefaultWalletBalanceToUsers } from "@app/accounts/send-default-wallet-balance-to-users"
import { getDisplayCurrencyConfig } from "@config"
import { toSats } from "@domain/bitcoin"
import * as serviceLedger from "@services/ledger"
import { LedgerService } from "@services/ledger"
import { WalletsRepository, UsersRepository } from "@services/mongoose"
import { createPushNotificationContent } from "@services/notifications/create-push-notification-content"
import * as PushNotificationsServiceImpl from "@services/notifications/push-notifications"

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
      for (const { kratosUserId } of activeAccounts) {
        const user = await UsersRepository().findById(kratosUserId)
        if (user instanceof Error) throw user

        if (user.deviceTokens.length > 0) usersWithDeviceTokens++
      }

      expect(sendNotification.mock.calls.length).toBe(usersWithDeviceTokens)

      for (let i = 0; i < sendNotification.mock.calls.length; i++) {
        const [call] = sendNotification.mock.calls[i]
        const { defaultWalletId, kratosUserId } = activeAccounts[i]

        const user = await UsersRepository().findById(kratosUserId)
        if (user instanceof Error) throw user

        const wallet = await WalletsRepository().findById(defaultWalletId)
        if (wallet instanceof Error) {
          continue
          // FIXME: need to improve the tests:
          // on some tests, we just create account and user, no wallet
          //
          // need to make integration tests independent the one to the others
        }

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
