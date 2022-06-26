import { wrapAsyncToRunInSpan } from "@services/tracing"
import { getCurrentPrice } from "@app/prices"
import { NotificationsService } from "@services/notifications"
import { LedgerService } from "@services/ledger"

import {
  AccountsRepository,
  UsersRepository,
  WalletsRepository,
} from "@services/mongoose"

import { DisplayCurrency, DisplayCurrencyConverter } from "@domain/fiat"
import { WalletCurrency } from "@domain/shared"
import { toSats } from "@domain/bitcoin"

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
      const wallet = await WalletsRepository().findById(account.defaultWalletId)
      if (wallet instanceof Error) return wallet

      const recipientAccount = await AccountsRepository().findById(wallet.accountId)
      if (recipientAccount instanceof Error) return recipientAccount

      const recipientUser = await UsersRepository().findById(recipientAccount.ownerId)
      if (recipientUser instanceof Error) return recipientUser

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
