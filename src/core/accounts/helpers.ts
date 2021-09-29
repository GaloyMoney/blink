import { getTwoFALimits, getUserLimits, MS_PER_DAY } from "@config/app"
import { LimitsChecker } from "@domain/accounts"
import { toLiabilitiesAccountId } from "@domain/ledger"
import { TwoFA, TwoFANewCodeNeededError } from "@domain/twoFA"
import { LedgerService } from "@services/ledger"
import { AccountsRepository } from "@services/mongoose"

export const getLimitsChecker = async (
  walletId: WalletId,
): Promise<LimitsChecker | ApplicationError> => {
  const ledgerService = LedgerService()

  const liabilitiesAccountId = toLiabilitiesAccountId(walletId)
  const timestamp1Day = new Date(Date.now() - MS_PER_DAY)
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

export const checkAndVerifyTwoFA = async ({
  amount,
  twoFAToken,
  twoFASecret,
  limitsChecker,
}: {
  amount: Satoshis
  twoFAToken: TwoFAToken | null
  twoFASecret: TwoFASecret
  limitsChecker: LimitsChecker
}): Promise<true | ApplicationError> => {
  const twoFALimitCheck = limitsChecker.checkTwoFA({
    amount,
  })
  if (!(twoFALimitCheck instanceof Error)) return true

  if (!twoFAToken) return new TwoFANewCodeNeededError()

  const validTwoFA = TwoFA().verify({
    secret: twoFASecret,
    token: twoFAToken,
  })
  if (validTwoFA instanceof Error) return validTwoFA

  return true
}
