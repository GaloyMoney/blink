import { getTwoFALimits, getUserLimits, MS_PER_DAY } from "@config"
import { LimitsChecker } from "@domain/accounts"
import { TwoFA, TwoFANewCodeNeededError } from "@domain/twoFA"
import { LedgerService } from "@services/ledger"
import { AccountsRepository, WalletsRepository } from "@services/mongoose"

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
  const timestamp1Day = new Date(Date.now() - MS_PER_DAY)

  const walletVolume = await ledgerService.intraledgerTxVolumeSince({
    walletId,
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
  const timestamp1Day = new Date(Date.now() - MS_PER_DAY)

  const walletVolume = await ledgerService.externalPaymentVolumeSince({
    walletId,
    timestamp: timestamp1Day,
  })
  if (walletVolume instanceof Error) return walletVolume

  return limitsChecker.checkWithdrawal({
    amount,
    walletVolume,
  })
}

export const checkTwoFALimits = async ({
  amount,
  walletId,
}: {
  amount: Satoshis
  walletId: WalletId
}) => {
  const limitsChecker = await getLimitsChecker(walletId)
  if (limitsChecker instanceof Error) return limitsChecker

  const ledgerService = LedgerService()
  const timestamp1Day = new Date(Date.now() - MS_PER_DAY)

  const walletVolume = await ledgerService.allPaymentVolumeSince({
    walletId,
    timestamp: timestamp1Day,
  })
  if (walletVolume instanceof Error) return walletVolume

  return limitsChecker.checkTwoFA({
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
  const twoFALimitCheck = await checkTwoFALimits({
    amount,
    walletId,
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
  const wallet = await WalletsRepository().findById(walletId)
  if (wallet instanceof Error) return wallet

  const account = await AccountsRepository().findById(wallet.accountId)
  if (account instanceof Error) return account
  const { level } = account

  const userLimits = getUserLimits({ level })
  const twoFALimits = getTwoFALimits()
  return LimitsChecker({
    userLimits,
    twoFALimits,
  })
}
