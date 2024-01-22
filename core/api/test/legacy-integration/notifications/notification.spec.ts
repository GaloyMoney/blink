import { getRecentlyActiveAccounts } from "@/app/accounts/active-accounts"
import { sendDefaultWalletBalanceToAccounts } from "@/app/accounts/send-default-wallet-balance-to-users"

import { toSats } from "@/domain/bitcoin"
import { UsdDisplayCurrency, toCents } from "@/domain/fiat"
import { LedgerService } from "@/services/ledger"
import * as serviceLedger from "@/services/ledger"
import {
  WalletsRepository,
  UsersRepository,
  AccountsRepository,
} from "@/services/mongoose"
import { createPushNotificationContent } from "@/services/notifications/create-push-notification-content"
import * as PushNotificationsServiceImpl from "@/services/notifications/push-notifications"
import { NotificationsService } from "@/services/notifications"
import {
  getCurrentPriceAsWalletPriceRatio,
  getCurrentPriceAsDisplayPriceRatio,
} from "@/app/prices"
import { WalletCurrency } from "@/domain/shared"
import { GaloyNotificationCategories } from "@/domain/notifications"
import { displayCurrencyPerBaseUnitFromAmounts } from "@/domain/wallets/tx-history"
import { AccountLevel } from "@/domain/accounts"

// @ts-ignore-next-line no-implicit-any error
let spy
let displayPriceRatios: Record<string, DisplayPriceRatio<"BTC", DisplayCurrency>>

const accountId = "AccountId" as AccountId
const walletId = "walletId" as WalletId
const paymentHash = "paymentHash" as PaymentHash
const txHash = "txHash" as OnChainTxHash
const deviceTokens = ["token" as DeviceToken]
const userId = "UserId" as UserId
const language = "" as UserLanguageOrEmpty
const paymentAmount = {
  amount: 1000n,
  currency: WalletCurrency.Btc,
  settlementAmount: toSats(1000),
  settlementAmountSend: toSats(-1000),
  settlementFee: toSats(0),
  settlementDisplayFee: "0",
}
const usdPaymentAmount = {
  amount: 5n,
  currency: WalletCurrency.Usd,
  settlementAmount: toCents(5),
  settlementAmountSend: toCents(-5),
  settlementFee: toCents(0),
  settlementDisplayFee: "0",
}

const crcDisplayPaymentAmount = {
  amountInMinor: 350050n,
  currency: "CRC" as DisplayCurrency,
  displayInMajor: "3500.50",
}
const crcSettlementDisplayPrice = <S extends WalletCurrency>({
  walletAmount,
  walletCurrency,
}: {
  walletAmount: number
  walletCurrency: S
}) =>
  displayCurrencyPerBaseUnitFromAmounts({
    displayCurrency: crcDisplayPaymentAmount.currency,
    displayAmount: Number(crcDisplayPaymentAmount.amountInMinor),
    walletAmount,
    walletCurrency,
  })

beforeAll(async () => {
  const usdDisplayPriceRatio = await getCurrentPriceAsDisplayPriceRatio({
    currency: UsdDisplayCurrency,
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
  /* eslint @typescript-eslint/ban-ts-comment: "off" */
  // @ts-ignore-next-line no-implicit-any error
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
  describe("sendFilteredNotification", () => {
    // FIXME
    // 1/ we don't use this code in production any more
    // 2/ this is a very convoluted test that relies on other tests as an artefact.
    // It's hard to debug. it's probably something we'll want to refactor with more cleaner/independant integration tests.
    it.skip("sends daily balance to active users", async () => {
      const sendFilteredNotification = jest.fn()
      jest
        .spyOn(PushNotificationsServiceImpl, "PushNotificationsService")
        .mockImplementation(() => ({
          sendFilteredNotification,
          sendNotification: jest.fn(),
        }))

      await sendDefaultWalletBalanceToAccounts()
      const activeAccounts = getRecentlyActiveAccounts()
      if (activeAccounts instanceof Error) throw activeAccounts

      const activeAccountsArray = await toArray(activeAccounts)

      expect(activeAccountsArray.length).toBeGreaterThan(0)
      expect(sendFilteredNotification.mock.calls.length).toBeGreaterThan(0)

      let usersWithDeviceTokens = 0
      for (const { kratosUserId } of activeAccountsArray) {
        const user = await UsersRepository().findById(kratosUserId)
        if (user instanceof Error) throw user

        if (user.deviceTokens.length > 0) usersWithDeviceTokens++
      }

      expect(sendFilteredNotification.mock.calls.length).toBe(usersWithDeviceTokens)

      for (let i = 0; i < sendFilteredNotification.mock.calls.length; i++) {
        const [call] = sendFilteredNotification.mock.calls[i]
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
            currency: UsdDisplayCurrency,
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
          userLanguage: "en-US",
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
          const sendFilteredNotification = jest.fn()
          jest
            .spyOn(PushNotificationsServiceImpl, "PushNotificationsService")
            .mockImplementationOnce(() => ({
              sendFilteredNotification,
              sendNotification: jest.fn(),
            }))

          await NotificationsService().sendTransaction({
            recipient: {
              accountId,
              walletId,
              deviceTokens,
              userId,
              level: AccountLevel.One,
            },
            transaction: {
              id: "id" as LedgerTransactionId,
              status: "success",
              memo: "",
              walletId,
              initiationVia: {
                type: "lightning",
                paymentHash,
                pubkey: "pk" as Pubkey,
              },
              settlementVia: {
                type: "lightning",
                revealedPreImage: undefined,
              },
              settlementAmount: paymentAmount.settlementAmount,
              settlementCurrency: paymentAmount.currency,
              settlementFee: paymentAmount.settlementFee,
              settlementDisplayAmount: crcDisplayPaymentAmount.displayInMajor,
              settlementDisplayPrice: crcSettlementDisplayPrice({
                walletAmount: toSats(paymentAmount.amount),
                walletCurrency: paymentAmount.currency,
              }),
              settlementDisplayFee: paymentAmount.settlementDisplayFee,
              createdAt: new Date(),
            },
          })

          expect(sendFilteredNotification.mock.calls.length).toBe(1)
          expect(sendFilteredNotification.mock.calls[0][0].title).toBe(title)
          expect(sendFilteredNotification.mock.calls[0][0].body).toBe(body)
          expect(sendFilteredNotification.mock.calls[0][0].notificationCategory).toBe(
            GaloyNotificationCategories.Payments,
          )
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
          const sendFilteredNotification = jest.fn()
          jest
            .spyOn(PushNotificationsServiceImpl, "PushNotificationsService")
            .mockImplementationOnce(() => ({
              sendFilteredNotification,
              sendNotification: jest.fn(),
            }))

          await NotificationsService().sendTransaction({
            recipient: {
              accountId,
              walletId,
              deviceTokens,
              userId,
              level: AccountLevel.One,
            },
            transaction: {
              id: "id" as LedgerTransactionId,
              status: "success",
              memo: "",
              walletId,
              initiationVia: {
                type: "intraledger",
                counterPartyUsername: "user" as Username,
                counterPartyWalletId: "walletId" as WalletId,
              },
              settlementVia: {
                type: "intraledger",
                counterPartyUsername: "user" as Username,
                counterPartyWalletId: "walletId" as WalletId,
              },
              settlementAmount: paymentAmount.settlementAmount,
              settlementCurrency: paymentAmount.currency,
              settlementFee: paymentAmount.settlementFee,
              settlementDisplayAmount: crcDisplayPaymentAmount.displayInMajor,
              settlementDisplayPrice: crcSettlementDisplayPrice({
                walletAmount: toSats(paymentAmount.amount),
                walletCurrency: paymentAmount.currency,
              }),
              settlementDisplayFee: paymentAmount.settlementDisplayFee,
              createdAt: new Date(),
            },
          })

          expect(sendFilteredNotification.mock.calls.length).toBe(1)
          expect(sendFilteredNotification.mock.calls[0][0].title).toBe(title)
          expect(sendFilteredNotification.mock.calls[0][0].body).toBe(body)
          expect(sendFilteredNotification.mock.calls[0][0].notificationCategory).toBe(
            GaloyNotificationCategories.Payments,
          )
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
          const sendFilteredNotification = jest.fn()
          jest
            .spyOn(PushNotificationsServiceImpl, "PushNotificationsService")
            .mockImplementationOnce(() => ({
              sendFilteredNotification,
              sendNotification: jest.fn(),
            }))

          await NotificationsService().sendTransaction({
            recipient: {
              accountId,
              walletId,
              deviceTokens,
              userId,
              level: AccountLevel.One,
            },
            transaction: {
              id: "id" as LedgerTransactionId,
              status: "success",
              memo: "",
              walletId,
              initiationVia: {
                type: "onchain",
              },
              settlementVia: {
                type: "onchain",
                transactionHash: txHash,
              },
              settlementAmount: paymentAmount.settlementAmount,
              settlementCurrency: paymentAmount.currency,
              settlementFee: paymentAmount.settlementFee,
              settlementDisplayAmount: crcDisplayPaymentAmount.displayInMajor,
              settlementDisplayPrice: crcSettlementDisplayPrice({
                walletAmount: toSats(paymentAmount.amount),
                walletCurrency: paymentAmount.currency,
              }),
              settlementDisplayFee: paymentAmount.settlementDisplayFee,
              createdAt: new Date(),
            },
          })

          expect(sendFilteredNotification.mock.calls.length).toBe(1)
          expect(sendFilteredNotification.mock.calls[0][0].title).toBe(title)
          expect(sendFilteredNotification.mock.calls[0][0].body).toBe(body)
          expect(sendFilteredNotification.mock.calls[0][0].notificationCategory).toBe(
            GaloyNotificationCategories.Payments,
          )
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
          const sendFilteredNotification = jest.fn()
          jest
            .spyOn(PushNotificationsServiceImpl, "PushNotificationsService")
            .mockImplementationOnce(() => ({
              sendFilteredNotification,
              sendNotification: jest.fn(),
            }))

          await NotificationsService().sendTransaction({
            recipient: {
              accountId,
              walletId,
              deviceTokens,
              userId,
              level: AccountLevel.One,
            },
            transaction: {
              id: "id" as LedgerTransactionId,
              status: "pending",
              memo: "",
              walletId,
              initiationVia: {
                type: "onchain",
              },
              settlementVia: {
                type: "onchain",
                transactionHash: txHash,
              },
              settlementAmount: paymentAmount.settlementAmount,
              settlementCurrency: paymentAmount.currency,
              settlementFee: paymentAmount.settlementFee,
              settlementDisplayAmount: crcDisplayPaymentAmount.displayInMajor,
              settlementDisplayPrice: crcSettlementDisplayPrice({
                walletAmount: toSats(paymentAmount.amount),
                walletCurrency: paymentAmount.currency,
              }),
              settlementDisplayFee: paymentAmount.settlementDisplayFee,
              createdAt: new Date(),
            },
          })

          expect(sendFilteredNotification.mock.calls.length).toBe(1)
          expect(sendFilteredNotification.mock.calls[0][0].title).toBe(title)
          expect(sendFilteredNotification.mock.calls[0][0].body).toBe(body)
          expect(sendFilteredNotification.mock.calls[0][0].notificationCategory).toBe(
            GaloyNotificationCategories.Payments,
          )
        }),
      )
    })

    describe("onChainTxSent", () => {
      const tests = [
        {
          name: "btc",
          paymentAmount,
          title: "BTC Transaction",
          body: "Sent onchain payment of -₡3,500.50 | -1,000 sats confirmed",
        },
        {
          name: "usd",
          paymentAmount: usdPaymentAmount,
          title: "USD Transaction",
          body: "Sent onchain payment of -₡3,500.50 | -$0.05 confirmed",
        },
      ]

      tests.forEach(({ name, paymentAmount, title, body }) =>
        it(`${name}`, async () => {
          const sendFilteredNotification = jest.fn()
          jest
            .spyOn(PushNotificationsServiceImpl, "PushNotificationsService")
            .mockImplementationOnce(() => ({
              sendFilteredNotification,
              sendNotification: jest.fn(),
            }))

          await NotificationsService().sendTransaction({
            recipient: {
              accountId,
              walletId,
              deviceTokens,
              userId,
              level: AccountLevel.One,
            },
            transaction: {
              id: "id" as LedgerTransactionId,
              status: "success",
              memo: "",
              walletId,
              initiationVia: {
                type: "onchain",
              },
              settlementVia: {
                type: "onchain",
                transactionHash: txHash,
              },
              settlementAmount: paymentAmount.settlementAmountSend,
              settlementCurrency: paymentAmount.currency,
              settlementFee: paymentAmount.settlementFee,
              settlementDisplayAmount: `-${crcDisplayPaymentAmount.displayInMajor}`,
              settlementDisplayPrice: crcSettlementDisplayPrice({
                walletAmount: toSats(paymentAmount.amount),
                walletCurrency: paymentAmount.currency,
              }),
              settlementDisplayFee: `-${paymentAmount.settlementDisplayFee}`,
              createdAt: new Date(),
            },
          })

          expect(sendFilteredNotification.mock.calls.length).toBe(1)
          expect(sendFilteredNotification.mock.calls[0][0].title).toBe(title)
          expect(sendFilteredNotification.mock.calls[0][0].body).toBe(body)
          expect(sendFilteredNotification.mock.calls[0][0].notificationCategory).toBe(
            GaloyNotificationCategories.Payments,
          )
        }),
      )
    })
  })
})
