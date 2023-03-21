import { Accounts } from "@app"
import { getRecentlyActiveAccounts } from "@app/accounts/active-accounts"
import { sendDefaultWalletBalanceToAccounts } from "@app/accounts/send-default-wallet-balance-to-users"

import { toSats } from "@domain/bitcoin"
import { DisplayCurrency, minorToMajorUnit } from "@domain/fiat"
import { LedgerService } from "@services/ledger"
import * as serviceLedger from "@services/ledger"
import {
  WalletsRepository,
  UsersRepository,
  AccountsRepository,
} from "@services/mongoose"
import { createPushNotificationContent } from "@services/notifications/create-push-notification-content"
import * as PushNotificationsServiceImpl from "@services/notifications/push-notifications"
import {
  getCurrentPriceAsWalletPriceRatio,
  getCurrentPriceAsDisplayPriceRatio,
} from "@app/prices"
import { WalletCurrency } from "@domain/shared"

import { getAccountByTestUserRef, getUsdWalletIdByTestUserRef } from "test/helpers"

let spy
let displayPriceRatios: Record<string, DisplayPriceRatio<"BTC", DisplayCurrency>>

beforeAll(async () => {
  const walletIdUsdB = await getUsdWalletIdByTestUserRef("B")
  const accountB = await getAccountByTestUserRef("B")
  const updated = await Accounts.updateDefaultWalletId({
    accountId: accountB.id,
    walletId: walletIdUsdB,
  })
  if (updated instanceof Error) throw updated

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

        const account = await AccountsRepository().findById(wallet.accountId)
        if (account instanceof Error) throw account
        const { displayCurrency } = account
        const displayPriceRatio = displayPriceRatios[displayCurrency]

        const balance = await LedgerService().getWalletBalance(defaultWalletId)
        if (balance instanceof Error) throw balance
        const balanceAmount = { amount: BigInt(balance), currency: wallet.currency }

        let displayPaymentAmount: DisplayAmount<DisplayCurrency>
        if (balanceAmount.currency === WalletCurrency.Btc) {
          const majorBalanceAmount = Number(
            minorToMajorUnit({
              amount: displayPriceRatio.convertFromWallet(
                balanceAmount as BtcPaymentAmount,
              ).amountInMinor,
              displayCurrency,
            }),
          )

          displayPaymentAmount = {
            amount: majorBalanceAmount,
            currency: displayCurrency,
          }
        } else {
          const walletPriceRatio = await getCurrentPriceAsWalletPriceRatio({
            currency: WalletCurrency.Usd,
          })
          if (walletPriceRatio instanceof Error) throw walletPriceRatio
          const btcBalanceAmount = walletPriceRatio.convertFromUsd(
            balanceAmount as UsdPaymentAmount,
          )

          const majorBalanceAmount = Number(
            minorToMajorUnit({
              amount: displayPriceRatio.convertFromWallet(btcBalanceAmount).amountInMinor,
              displayCurrency,
            }),
          )

          displayPaymentAmount = {
            amount: majorBalanceAmount,
            currency: displayCurrency,
          }
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
  })
})
