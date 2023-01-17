import { DisplayCurrencyConverter } from "@domain/fiat"
import { BtcPaymentAmount, WalletCurrency } from "@domain/shared"

import { getCurrentPrice } from "@app/prices"
import { LedgerService } from "@services/ledger"
import { WalletsRepository, UsersRepository } from "@services/mongoose"
import { NotificationsService } from "@services/notifications"
import { wrapAsyncToRunInSpan } from "@services/tracing"

import { getRecentlyActiveAccounts } from "./active-accounts"

export const sendDefaultWalletBalanceToAccounts = async () => {
  const accounts = getRecentlyActiveAccounts()
  if (accounts instanceof Error) throw accounts

  const notifyUser = wrapAsyncToRunInSpan({
    namespace: "daily-balance-notification",
    fn: async (account: Account): Promise<void | ApplicationError> => {
      const user = await UsersRepository().findById(account.kratosUserId)
      if (user instanceof Error) return user
      if (user.deviceTokens.length === 0) return

      const wallet = await WalletsRepository().findById(account.defaultWalletId)
      if (wallet instanceof Error) return wallet

      const balanceAmount = await LedgerService().getWalletBalanceAmount(wallet)
      if (balanceAmount instanceof Error) return balanceAmount

      let displayBalanceAmount: DisplayBalanceAmount<DisplayCurrency> | undefined
      if (wallet.currency === WalletCurrency.Btc) {
        const converter = DisplayCurrencyConverter({
          currency: account.displayCurrency,
          getPriceFn: getCurrentPrice,
        })
        const amount = BtcPaymentAmount(balanceAmount.amount)
        const displayAmount = await converter.fromBtcAmount(amount)
        if (!(displayAmount instanceof Error)) {
          displayBalanceAmount = {
            amount: displayAmount,
            currency: account.displayCurrency,
          }
        }
      }

      return NotificationsService().sendBalance({
        balanceAmount,
        deviceTokens: user.deviceTokens,
        displayBalanceAmount,
        recipientLanguage: user.language,
      })
    },
  })

  for await (const account of accounts) {
    await notifyUser(account)
  }
}
