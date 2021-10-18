import { getTwoFALimits, getUserLimits, MS_PER_DAY } from "@config/app"
import { LimitsChecker } from "@domain/accounts"
import { toLiabilitiesAccountId } from "@domain/ledger"
import { TwoFA, TwoFANewCodeNeededError } from "@domain/twoFA"
import { LedgerService } from "@services/ledger"
import { AccountsRepository } from "@services/mongoose"

export const checkIntraledgerLimits = async ({
  amount,
  walletId,
}: {
  amount: Satoshis
  walletId: WalletId
}) => {
  const limitsChecker = await getLimitsChecker(walletId)
  if (limitsChecker instanceof Error) return limitsChecker

  const ledgerService = LedgerService()
  const liabilitiesAccountId = toLiabilitiesAccountId(walletId)
  const timestamp1Day = new Date(Date.now() - MS_PER_DAY)

  const walletVolume = await ledgerService.intraledgerTxVolumeSince({
    liabilitiesAccountId,
    timestamp: timestamp1Day,
  })
  if (walletVolume instanceof Error) return walletVolume

  return limitsChecker.checkIntraledger({
    amount,
    walletVolume,
  })
}

export const checkWithdrawalLimits = async ({
  amount,
  walletId,
}: {
  amount: Satoshis
  walletId: WalletId
}) => {
  const limitsChecker = await getLimitsChecker(walletId)
  if (limitsChecker instanceof Error) return limitsChecker

  const ledgerService = LedgerService()
  const liabilitiesAccountId = toLiabilitiesAccountId(walletId)
  const timestamp1Day = new Date(Date.now() - MS_PER_DAY)

  const walletVolume = await ledgerService.withdrawalTxVolumeSince({
    liabilitiesAccountId,
    timestamp: timestamp1Day,
  })
  if (walletVolume instanceof Error) return walletVolume

  return limitsChecker.checkWithdrawal({
    amount,
    walletVolume,
  })
}

export const checkAndVerifyTwoFA = async ({
  amount,
  twoFAToken,
  twoFASecret,
  walletId,
}: {
  amount: Satoshis
  twoFAToken: TwoFAToken | null
  twoFASecret: TwoFASecret
  walletId: WalletId
}): Promise<true | ApplicationError> => {
  const ledgerService = LedgerService()
  const liabilitiesAccountId = toLiabilitiesAccountId(walletId)
  const timestamp1Day = new Date(Date.now() - MS_PER_DAY)

  const walletVolume = await ledgerService.twoFATxVolumeSince({
    liabilitiesAccountId,
    timestamp: timestamp1Day,
  })
  if (walletVolume instanceof Error) return walletVolume

  const limitsChecker = await getLimitsChecker(walletId)
  if (limitsChecker instanceof Error) return limitsChecker

  const twoFALimitCheck = limitsChecker.checkTwoFA({
    amount,
    walletVolume,
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

const getLimitsChecker = async (
  walletId: WalletId,
): Promise<LimitsChecker | ApplicationError> => {
  const account = await AccountsRepository().findByWalletId(walletId)
  if (account instanceof Error) return account
  const { level } = account

  const userLimits = getUserLimits({ level })
  const twoFALimits = getTwoFALimits()
  return LimitsChecker({
    userLimits,
    twoFALimits,
  })
}
