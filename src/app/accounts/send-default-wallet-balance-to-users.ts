import { wrapAsyncToRunInSpan } from "@services/tracing"
import { getCurrentPrice } from "@app/prices"
import { NotificationsService } from "@services/notifications"
import { LedgerService } from "@services/ledger"

import { WalletsRepository } from "@services/mongoose"

import { getRecentlyActiveAccounts } from "./active-accounts"

export const sendDefaultWalletBalanceToUsers = async (logger: Logger) => {
  const accounts = await getRecentlyActiveAccounts()
  if (accounts instanceof Error) throw accounts

  const price = await getCurrentPrice()

  const notifyUser = async (account) => {
    const balance = await LedgerService().getWalletBalance(account.defaultWalletId)
    if (balance instanceof Error) return balance

    const wallet = await WalletsRepository().findById(account.defaultWalletId)
    if (wallet instanceof Error) return wallet

    await NotificationsService(logger).sendBalance({
      balance,
      walletCurrency: wallet.currency,
      userId: account.ownerId,
      price,
    })
  }

  for (const account of accounts) {
    await wrapAsyncToRunInSpan({
      namespace: "daily-balance-notification",
      fn: async () => notifyUser(account),
    })()
  }
}
