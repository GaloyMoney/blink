import { getRecentlyActiveAccounts } from "@app/accounts/active-accounts"
import { sendDefaultWalletBalanceToAccounts } from "@app/accounts/send-default-wallet-balance-to-users"

import { toSats } from "@domain/bitcoin"
import { DisplayCurrency } from "@domain/fiat"
import { LedgerService } from "@services/ledger"
import * as serviceLedger from "@services/ledger"
import {
  WalletsRepository,
  UsersRepository,
  AccountsRepository,
} from "@services/mongoose"
import { createPushNotificationContent } from "@services/notifications/create-push-notification-content"
import * as PushNotificationsServiceImpl from "@services/notifications/push-notifications"
import { NotificationsService } from "@services/notifications"
import {
  getCurrentPriceAsWalletPriceRatio,
  getCurrentPriceAsDisplayPriceRatio,
} from "@app/prices"
import { WalletCurrency } from "@domain/shared"

let spy
let displayPriceRatios: Record<string, DisplayPriceRatio<"BTC", DisplayCurrency>>

const accountId = "accountId" as AccountId
const walletId = "walletId" as WalletId
const paymentHash = "paymentHash" as PaymentHash
const txHash = "txHash" as OnChainTxHash
const deviceTokens = ["token" as DeviceToken]
const language = "" as UserLanguageOrEmpty
const paymentAmount = {
  amount: 1000n,
  currency: WalletCurrency.Btc,
}
const usdPaymentAmount = {
  amount: 5n,
  currency: WalletCurrency.Usd,
}

const crcDisplayPaymentAmount = {
  amountInMinor: 350050n,
  currency: "CRC" as DisplayCurrency,
  displayInMajor: "3500.50",
}

beforeAll(async () => {
  const usdDisplayPriceRatio = await getCurrentPriceAsDisplayPriceRatio({
    currency: DisplayCurrency.Usd,
  })
  if (usdDisplayPriceRatio instanceof Error) throw usdDisplayPriceRatio

  const eurDisplayPriceRatio = await getCurrentPriceAsDisplayPriceRatio({
    currency: "EUR" as DisplayCurrency,
  })
  if (eurDisplayPriceRatio instanceof Error) throw eurDisplayPriceRatio

  const crcDisplayPriceRatio = await getCurrentPriceAsDisplayPriceRatio({
    currency: "CRC" as DisplayCurrency,
  })
  if (crcDisplayPriceRatio instanceof Error) throw crcDisplayPriceRatio

  displayPriceRatios = {
    USD: usdDisplayPriceRatio,
    EUR: eurDisplayPriceRatio,
    CRC: crcDisplayPriceRatio,
  }

  const ledgerService = serviceLedger.LedgerService()

  spy = jest.spyOn(serviceLedger, "LedgerService").mockImplementation(() => ({
    ...ledgerService,
    allTxBaseVolumeSince: async () => ({
      outgoingBaseAmount: toSats(10_000),
      incomingBaseAmount: toSats(10_000),
    }),
  }))
})

afterAll(async () => {
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

        const account = await AccountsRepository().findById(wallet.accountId)
        if (account instanceof Error) throw account
        const { displayCurrency } = account
        const displayPriceRatio = displayPriceRatios[displayCurrency]

        const balance = await LedgerService().getWalletBalance(defaultWalletId)
        if (balance instanceof Error) throw balance
        const balanceAmount = { amount: BigInt(balance), currency: wallet.currency }

        let displayPaymentAmount: DisplayAmount<DisplayCurrency> | undefined = undefined
        if (balanceAmount.currency === WalletCurrency.Btc) {
          const displayAmount = displayPriceRatio.convertFromWallet(
            balanceAmount as BtcPaymentAmount,
          )

          displayPaymentAmount = displayAmount
        } else {
          const walletPriceRatio = await getCurrentPriceAsWalletPriceRatio({
            currency: WalletCurrency.Usd,
          })
          if (walletPriceRatio instanceof Error) throw walletPriceRatio
          const btcBalanceAmount = walletPriceRatio.convertFromUsd(
            balanceAmount as UsdPaymentAmount,
          )

          const displayAmount = displayPriceRatio.convertFromWallet(btcBalanceAmount)
          if (displayAmount instanceof Error) throw displayAmount

          displayPaymentAmount = displayAmount
        }

        const { title, body } = createPushNotificationContent({
          type: "balance",
          userLanguage: user.language,
          amount: balanceAmount,
          displayAmount: displayPaymentAmount,
        })

        expect(call.title).toBe(title)
        expect(call.body).toBe(body)
      }
    })

    describe("lightningTxReceived", () => {
      const tests = [
        {
          name: "btc",
          paymentAmount,
          title: "BTC Transaction",
          body: "+₡3,500.50 | 1,000 sats",
        },
        {
          name: "usd",
          paymentAmount: usdPaymentAmount,
          title: "USD Transaction",
          body: "+₡3,500.50 | $0.05",
        },
      ]
      tests.forEach(({ name, paymentAmount, title, body }) =>
        it(`${name}`, async () => {
          const sendNotification = jest.fn()
          jest
            .spyOn(PushNotificationsServiceImpl, "PushNotificationsService")
            .mockImplementationOnce(() => ({
              sendNotification,
            }))

          await NotificationsService().lightningTxReceived({
            paymentAmount,

            recipientAccountId: accountId,
            recipientWalletId: walletId,
            displayPaymentAmount: crcDisplayPaymentAmount,
            paymentHash,
            recipientDeviceTokens: deviceTokens,
            recipientLanguage: language,
          })

          expect(sendNotification.mock.calls.length).toBe(1)
          expect(sendNotification.mock.calls[0][0].title).toBe(title)
          expect(sendNotification.mock.calls[0][0].body).toBe(body)
        }),
      )
    })

    describe("intraLedgerTxReceived", () => {
      const tests = [
        {
          name: "btc",
          paymentAmount,
          title: "BTC Transaction",
          body: "+₡3,500.50 | 1,000 sats",
        },
        {
          name: "usd",
          paymentAmount: usdPaymentAmount,
          title: "USD Transaction",
          body: "+₡3,500.50 | $0.05",
        },
      ]

      tests.forEach(({ name, paymentAmount, title, body }) =>
        it(`${name}`, async () => {
          const sendNotification = jest.fn()
          jest
            .spyOn(PushNotificationsServiceImpl, "PushNotificationsService")
            .mockImplementationOnce(() => ({
              sendNotification,
            }))

          await NotificationsService().intraLedgerTxReceived({
            paymentAmount,

            recipientAccountId: accountId,
            recipientWalletId: walletId,
            displayPaymentAmount: crcDisplayPaymentAmount,
            recipientDeviceTokens: deviceTokens,
            recipientLanguage: language,
          })

          expect(sendNotification.mock.calls.length).toBe(1)
          expect(sendNotification.mock.calls[0][0].title).toBe(title)
          expect(sendNotification.mock.calls[0][0].body).toBe(body)
        }),
      )
    })

    describe("onChainTxReceived", () => {
      const tests = [
        {
          name: "btc",
          paymentAmount,
          title: "BTC Transaction",
          body: "+₡3,500.50 | 1,000 sats",
        },
        {
          name: "usd",
          paymentAmount: usdPaymentAmount,
          title: "USD Transaction",
          body: "+₡3,500.50 | $0.05",
        },
      ]

      tests.forEach(({ name, paymentAmount, title, body }) =>
        it(`${name}`, async () => {
          const sendNotification = jest.fn()
          jest
            .spyOn(PushNotificationsServiceImpl, "PushNotificationsService")
            .mockImplementationOnce(() => ({
              sendNotification,
            }))

          await NotificationsService().onChainTxReceived({
            paymentAmount,

            recipientAccountId: accountId,
            recipientWalletId: walletId,
            displayPaymentAmount: crcDisplayPaymentAmount,
            txHash,
            recipientDeviceTokens: deviceTokens,
            recipientLanguage: language,
          })

          expect(sendNotification.mock.calls.length).toBe(1)
          expect(sendNotification.mock.calls[0][0].title).toBe(title)
          expect(sendNotification.mock.calls[0][0].body).toBe(body)
        }),
      )
    })

    describe("onChainTxReceivedPending", () => {
      const tests = [
        {
          name: "btc",
          paymentAmount,
          title: "BTC Transaction | Pending",
          body: "pending +₡3,500.50 | 1,000 sats",
        },
        {
          name: "usd",
          paymentAmount: usdPaymentAmount,
          title: "USD Transaction | Pending",
          body: "pending +₡3,500.50 | $0.05",
        },
      ]

      tests.forEach(({ name, paymentAmount, title, body }) =>
        it(`${name}`, async () => {
          const sendNotification = jest.fn()
          jest
            .spyOn(PushNotificationsServiceImpl, "PushNotificationsService")
            .mockImplementationOnce(() => ({
              sendNotification,
            }))

          await NotificationsService().onChainTxReceivedPending({
            recipientAccountId: accountId,
            recipientWalletId: walletId,
            paymentAmount,
            txHash,
            displayPaymentAmount: crcDisplayPaymentAmount,
            recipientDeviceTokens: deviceTokens,
            recipientLanguage: language,
          })

          expect(sendNotification.mock.calls.length).toBe(1)
          expect(sendNotification.mock.calls[0][0].title).toBe(title)
          expect(sendNotification.mock.calls[0][0].body).toBe(body)
        }),
      )
    })

    describe("onChainTxSent", () => {
      const tests = [
        {
          name: "btc",
          paymentAmount,
          title: "BTC Transaction",
          body: "Sent onchain payment of +₡3,500.50 | 1,000 sats confirmed",
        },
        {
          name: "usd",
          paymentAmount: usdPaymentAmount,
          title: "USD Transaction",
          body: "Sent onchain payment of +₡3,500.50 | $0.05 confirmed",
        },
      ]

      tests.forEach(({ name, paymentAmount, title, body }) =>
        it(`${name}`, async () => {
          const sendNotification = jest.fn()
          jest
            .spyOn(PushNotificationsServiceImpl, "PushNotificationsService")
            .mockImplementationOnce(() => ({
              sendNotification,
            }))

          await NotificationsService().onChainTxSent({
            senderAccountId: accountId,
            senderWalletId: walletId,
            paymentAmount,
            txHash,
            displayPaymentAmount: crcDisplayPaymentAmount,
            senderDeviceTokens: deviceTokens,
            senderLanguage: language,
          })

          expect(sendNotification.mock.calls.length).toBe(1)
          expect(sendNotification.mock.calls[0][0].title).toBe(title)
          expect(sendNotification.mock.calls[0][0].body).toBe(body)
        }),
      )
    })
  })
})
