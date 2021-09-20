import { getTwoFALimits, getUserLimits, MS_PER_DAY } from "@config/app"
import { LimitsChecker } from "@domain/accounts"
import { toLiabilitiesAccountId } from "@domain/ledger"
import { LedgerService } from "@services/ledger"
import { AccountsRepository } from "@services/mongoose"

export const getLimitsChecker = async (
  walletId: WalletId,
): Promise<LimitsChecker | ApplicationError> => {
  const ledgerService = LedgerService()

  const liabilitiesAccountId = toLiabilitiesAccountId(walletId)
  const timestamp1Day = (Date.now() - MS_PER_DAY) as UnixTimeMs
  const walletVolume = await ledgerService.txVolumeSince({
    liabilitiesAccountId,
    timestamp: timestamp1Day,
  })
  if (walletVolume instanceof Error) return walletVolume

  const account = await AccountsRepository().findByWalletId(walletId)
  if (account instanceof Error) return account
  const { level } = account

  const userLimits = getUserLimits({ level })
  const twoFALimits = getTwoFALimits()
  return LimitsChecker({
    walletVolume,
    userLimits,
    twoFALimits,
  })
}
