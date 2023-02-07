import { Prices } from "@app"
import { getRecentlyActiveAccounts } from "@app/accounts/active-accounts"
import { sendDefaultWalletBalanceToAccounts } from "@app/accounts/send-default-wallet-balance-to-users"

import { toSats } from "@domain/bitcoin"
import { DisplayCurrency } from "@domain/fiat"
import { LedgerService } from "@services/ledger"
import * as serviceLedger from "@services/ledger"
import { WalletsRepository, UsersRepository } from "@services/mongoose"
import { createPushNotificationContent } from "@services/notifications/create-push-notification-content"
import * as PushNotificationsServiceImpl from "@services/notifications/push-notifications"

let price, spy

beforeAll(async () => {
  price = await Prices.getCurrentSatPrice({ currency: DisplayCurrency.Usd })
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

async function toArray<T>(gen: AsyncIterable<T>): Promise<T[]> {
  const out: T[] = []
  for await (const x of gen) {
    out.push(x)
  }
  return out
}

describe("notification", () => {
  describe("sendNotification", () => {
    it("sends daily balance to active users", async () => {
      const sendNotification = jest.fn()
      jest
        .spyOn(PushNotificationsServiceImpl, "PushNotificationsService")
        .mockImplementation(() => ({ sendNotification }))

      await sendDefaultWalletBalanceToAccounts()
      const activeAccounts = getRecentlyActiveAccounts()
      if (activeAccounts instanceof Error) throw activeAccounts

      const activeAccountsArray = await toArray(activeAccounts)

      expect(activeAccountsArray.length).toBeGreaterThan(0)
      expect(sendNotification.mock.calls.length).toBeGreaterThan(0)

      let usersWithDeviceTokens = 0
      for (const { kratosUserId } of activeAccountsArray) {
        const user = await UsersRepository().findById(kratosUserId)
        if (user instanceof Error) throw user

        if (user.deviceTokens.length > 0) usersWithDeviceTokens++
      }

      expect(sendNotification.mock.calls.length).toBe(usersWithDeviceTokens)

      for (let i = 0; i < sendNotification.mock.calls.length; i++) {
        const [call] = sendNotification.mock.calls[i]
        const { defaultWalletId, kratosUserId } = activeAccountsArray[i]

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
          amount: balance * price.price,
          currency: price.currency,
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
