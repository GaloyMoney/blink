import { DisplayCurrency, usdMinorToMajorUnit } from "@domain/fiat"
import { WalletCurrency } from "@domain/shared"

import { getCurrentPriceAsWalletPriceRatio } from "@app/prices"
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

      const displayPriceRatio = await getCurrentPriceAsWalletPriceRatio({
        currency: DisplayCurrency.Usd,
      })
      let displayBalanceAmount: DisplayBalanceAmount<DisplayCurrency> | undefined
      if (
        !(displayPriceRatio instanceof Error) &&
        wallet.currency === WalletCurrency.Btc
      ) {
        const displayAmount = displayPriceRatio.convertFromBtc(
          balanceAmount as BtcPaymentAmount,
        )
        // TODO: unify PaymentAmount, BalanceAmount, DisplayBalanceAmount types
        displayBalanceAmount = {
          amount: usdMinorToMajorUnit(displayAmount.amount),
          currency: DisplayCurrency.Usd,
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
