import { USER_ACTIVENESS_MONTHLY_VOLUME_THRESHOLD } from "@config/app"
import { ActivityChecker } from "@domain/ledger"
import { listWalletIdsByAccountId } from "@app/wallets"
import { LedgerService } from "@services/ledger"
import { AccountsRepository } from "@services/mongoose"

export const getRecentlyActiveAccounts = async (): Promise<
  Account[] | ApplicationError
> => {
  const unlockedAccounts = await AccountsRepository().listUnlockedAccounts()
  if (unlockedAccounts instanceof Error) return unlockedAccounts

  const activeAccounts: Account[] = []
  const ledger = LedgerService()
  const activityChecker = ActivityChecker({
    getVolumeFn: ledger.allTxVolumeSince,
    monthlyVolumeThreshold: USER_ACTIVENESS_MONTHLY_VOLUME_THRESHOLD,
  })
  for (const account of unlockedAccounts) {
    // FIXME: this is a very slow query (not critical as only run daily on cron currently).
    // a mongodb query would be able to get the wallet in aggregate directly
    // from medici_transactions instead

    const walletIds = await listWalletIdsByAccountId(account.id)
    if (walletIds instanceof Error) return walletIds

    const volume = await activityChecker.aboveThreshold(walletIds)
    if (volume instanceof Error) continue
    if (volume) {
      activeAccounts.push(account)
    }
  }
  return activeAccounts
}
