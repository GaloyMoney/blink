import { getCurrentPrice } from "@app/prices"
import { getBalanceForWalletId } from "@app/wallets"
import { NotificationsService } from "@services/notifications"

import { getRecentlyActiveAccounts } from "./active-accounts"

export const sendDefaultWalletBalanceToUsers = async (logger: Logger) => {
  const accounts = await getRecentlyActiveAccounts()
  if (accounts instanceof Error) throw accounts

  const price = await getCurrentPrice()

  for (const account of accounts) {
    const balance = await getBalanceForWalletId(account.defaultWalletId)
    if (balance instanceof Error) throw balance

    await NotificationsService(logger).sendBalance({
      balance,
      userId: account.ownerId,
      price,
    })
  }
}
