import { MS_PER_30_DAYS, USER_ACTIVENESS_MONTHLY_VOLUME_THRESHOLD } from "@config/app"
import { LedgerService } from "@services/ledger"
import { AccountsRepository } from "@services/mongoose"

// user is considered active if there has been one transaction of more than USER_ACTIVENESS_MONTHLY_VOLUME_THRESHOLD sats in the last 30 days
const isAccountRecentlyActive = async (walletId: WalletId) => {
  const timestamp30DaysAgo = new Date(Date.now() - MS_PER_30_DAYS)
  const activenessThreshold = USER_ACTIVENESS_MONTHLY_VOLUME_THRESHOLD

  const ledger = LedgerService()
  const volume = await ledger.allTxVolumeSince({
    timestamp: timestamp30DaysAgo,
    walletId,
  })
  if (volume instanceof Error) return volume

  return (
    volume.outgoingSats > activenessThreshold || volume.incomingSats > activenessThreshold
  )
}

export const getRecentlyActiveAccount = async (): Promise<
  Account[] | ApplicationError
> => {
  const unlockedAccounts = await AccountsRepository().listUnlockedAccounts()
  if (unlockedAccounts instanceof Error) return unlockedAccounts

  const activeAccounts: Account[] = []
  for (const account of unlockedAccounts) {
    // FIXME: this is a very slow query (not critical as only run daily on cron currently).
    // a mongodb query would be able to get the wallet in aggregate directly
    // from medici_transactions instead
    if (await isAccountRecentlyActive(account.defaultWalletId)) {
      activeAccounts.push(account)
    }
  }
  return activeAccounts
}
