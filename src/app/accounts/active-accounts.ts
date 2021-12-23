import { MS_PER_30_DAYS, USER_ACTIVENESS_MONTHLY_VOLUME_THRESHOLD } from "@config/app"
import { toSats } from "@domain/bitcoin"
import { LedgerServiceError } from "@domain/ledger"
import { LedgerService } from "@services/ledger"
import { AccountsRepository } from "@services/mongoose"

export const getRecentlyActiveAccounts = async (): Promise<
  Account[] | ApplicationError
> => {
  const unlockedAccounts = await AccountsRepository().listUnlockedAccounts()
  if (unlockedAccounts instanceof Error) return unlockedAccounts

  const activeAccounts: Account[] = []
  for (const account of unlockedAccounts) {
    // FIXME: this is a very slow query (not critical as only run daily on cron currently).
    // a mongodb query would be able to get the wallet in aggregate directly
    // from medici_transactions instead
    if (await isAccountRecentlyActive(account.walletIds)) {
      activeAccounts.push(account)
    }
  }
  return activeAccounts
}

const sumActivityWalletIds = async ({
  walletIds,
  timestamp,
  getVolumeFn,
}: {
  walletIds: WalletId[]
  timestamp: Date
  getVolumeFn: (args: IGetVolumeArgs) => VolumeResult
}): Promise<TxVolume | ApplicationError> => {
  const volumeCum: TxVolume = {
    outgoingSats: toSats(0),
    incomingSats: toSats(0),
  }

  for (const walletId of walletIds) {
    const volume = await getVolumeFn({
      timestamp,
      walletId,
    })
    if (volume instanceof LedgerServiceError) return volume
    volumeCum.incomingSats = toSats(volume.incomingSats + volumeCum.incomingSats)
    volumeCum.outgoingSats = toSats(volume.outgoingSats + volumeCum.outgoingSats)
  }

  return volumeCum
}

// user is considered active if there has been one transaction of more than USER_ACTIVENESS_MONTHLY_VOLUME_THRESHOLD sats in the last 30 days
const isAccountRecentlyActive = async (
  walletIds: WalletId[],
): Promise<boolean | ApplicationError> => {
  const timestamp30DaysAgo = new Date(Date.now() - MS_PER_30_DAYS)
  const activenessThreshold = USER_ACTIVENESS_MONTHLY_VOLUME_THRESHOLD

  const ledger = LedgerService()

  const volume = await sumActivityWalletIds({
    timestamp: timestamp30DaysAgo,
    walletIds,
    getVolumeFn: ledger.allTxVolumeSince,
  })
  if (volume instanceof Error) return volume

  return (
    volume.outgoingSats > activenessThreshold || volume.incomingSats > activenessThreshold
  )
}
