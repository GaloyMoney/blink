import { USER_ACTIVENESS_MONTHLY_VOLUME_THRESHOLD } from "@config"
import { ActivityChecker } from "@domain/ledger"
import { WalletsRepository, AccountsRepository } from "@services/mongoose"
import { LedgerService } from "@services/ledger"

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

    const wallets = await WalletsRepository().listByAccountId(account.id)
    if (wallets instanceof Error) return wallets

    const volume = await activityChecker.aboveThreshold(wallets.map((w) => w.id))
    if (volume instanceof Error) continue
    if (volume) {
      activeAccounts.push(account)
    }
  }
  return activeAccounts
}
