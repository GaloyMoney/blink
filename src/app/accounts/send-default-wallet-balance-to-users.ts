import { toSats } from "@domain/bitcoin"
import { WalletCurrency } from "@domain/shared"
import { DisplayCurrency, DisplayCurrencyConverter } from "@domain/fiat"

import { getCurrentPrice } from "@app/prices"
import { LedgerService } from "@services/ledger"
import { wrapAsyncToRunInSpan } from "@services/tracing"
import { NotificationsService } from "@services/notifications"
import { UsersRepository, WalletsRepository } from "@services/mongoose"

import { getRecentlyActiveAccounts } from "./active-accounts"

export const sendDefaultWalletBalanceToUsers = async () => {
  const accounts = await getRecentlyActiveAccounts()
  if (accounts instanceof Error) throw accounts

  const price = await getCurrentPrice()
  const displayCurrencyPerSat = price instanceof Error ? undefined : price
  const converter = displayCurrencyPerSat
    ? DisplayCurrencyConverter(displayCurrencyPerSat)
    : undefined

  const notifyUser = wrapAsyncToRunInSpan({
    namespace: "daily-balance-notification",
    fn: async (account: Account): Promise<void | ApplicationError> => {
      const recipientUser = await UsersRepository().findById(account.ownerId)
      if (recipientUser instanceof Error) return recipientUser
      if (!recipientUser.deviceTokens || recipientUser.deviceTokens.length === 0) return

      const wallet = await WalletsRepository().findById(account.defaultWalletId)
      if (wallet instanceof Error) return wallet

      const balanceAmount = await LedgerService().getWalletBalanceAmount(wallet)
      if (balanceAmount instanceof Error) return balanceAmount

      let displayBalanceAmount: DisplayBalanceAmount<DisplayCurrency> | undefined
      if (converter && wallet.currency === WalletCurrency.Btc) {
        const amount = converter.fromSats(toSats(balanceAmount.amount))
        displayBalanceAmount = { amount, currency: DisplayCurrency.Usd }
      }

      return NotificationsService().sendBalance({
        balanceAmount,
        recipientDeviceTokens: recipientUser.deviceTokens,
        displayBalanceAmount,
        recipientLanguage: recipientUser.language,
      })
    },
  })

  for (const account of accounts) {
    await notifyUser(account)
  }
}
