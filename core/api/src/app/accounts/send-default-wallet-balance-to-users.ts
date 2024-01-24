import { getRecentlyActiveAccounts } from "./active-accounts"

import {
  getCurrentPriceAsDisplayPriceRatio,
  getCurrentPriceAsWalletPriceRatio,
} from "@/app/prices"
import { removeDeviceTokens } from "@/app/users/remove-device-tokens"

import { UsdDisplayCurrency } from "@/domain/fiat"
import { WalletCurrency } from "@/domain/shared"
import { DeviceTokensNotRegisteredNotificationsServiceError } from "@/domain/notifications"

import { LedgerService } from "@/services/ledger"
import { wrapAsyncToRunInSpan } from "@/services/tracing"
import { NotificationsService } from "@/services/notifications"
import { WalletsRepository, UsersRepository } from "@/services/mongoose"

export const sendDefaultWalletBalanceToAccounts = async () => {
  const accounts = getRecentlyActiveAccounts()
  if (accounts instanceof Error) throw accounts

  const notifyUser = wrapAsyncToRunInSpan({
    namespace: "daily-balance-notification",
    fn: async (account: Account): Promise<true | ApplicationError> => {
      const user = await UsersRepository().findById(account.kratosUserId)
      if (user instanceof Error) return user

      const wallet = await WalletsRepository().findById(account.defaultWalletId)
      if (wallet instanceof Error) return wallet

      const balanceAmount = await LedgerService().getWalletBalanceAmount(wallet)
      if (balanceAmount instanceof Error) return balanceAmount

      const { displayCurrency } = account
      const displayPriceRatio = await getCurrentPriceAsDisplayPriceRatio({
        currency: displayCurrency,
      })

      let displayAmount: DisplayAmount<DisplayCurrency> | undefined
      if (!(displayPriceRatio instanceof Error)) {
        if (balanceAmount.currency === WalletCurrency.Btc) {
          displayAmount = displayPriceRatio.convertFromWallet(
            balanceAmount as BtcPaymentAmount,
          )
        }

        if (balanceAmount.currency === WalletCurrency.Usd) {
          const usdWalletPriceRatio = await getCurrentPriceAsWalletPriceRatio({
            currency: UsdDisplayCurrency,
          })

          if (!(usdWalletPriceRatio instanceof Error)) {
            const btcBalanceAmount = usdWalletPriceRatio.convertFromUsd(
              balanceAmount as UsdPaymentAmount,
            )
            displayAmount = displayPriceRatio.convertFromWallet(btcBalanceAmount)
          }
        }
      }

      const result = await NotificationsService().sendBalance({
        balanceAmount,
        displayBalanceAmount: displayAmount,
        recipientUserId: user.id,
      })

      if (result instanceof DeviceTokensNotRegisteredNotificationsServiceError) {
        await removeDeviceTokens({ userId: user.id, deviceTokens: result.tokens })
      }

      return true
    },
  })

  for await (const account of accounts) {
    await notifyUser(account)
  }
}
