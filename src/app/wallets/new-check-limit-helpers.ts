import { getTwoFALimits, getAccountLimits, MS_PER_DAY } from "@config"
import { AccountLimitsChecker, TwoFALimitsChecker } from "@domain/accounts"
import { LedgerService } from "@services/ledger"
import { AccountsRepository } from "@services/mongoose"

const ledger = LedgerService()

export const newCheckIntraledgerLimits = async ({
  amount,
  wallet,
}: {
  amount: UsdPaymentAmount
  wallet: Wallet
}) => {
  const timestamp1Day = new Date(Date.now() - MS_PER_DAY)
  const walletVolume = await ledger.intraledgerTxBaseVolumeSince({
    walletId: wallet.id,
    timestamp: timestamp1Day,
  })
  if (walletVolume instanceof Error) return walletVolume
  const volumeInWalletCurrency = BigInt(walletVolume.outgoingBaseAmount)

  const account = await AccountsRepository().findById(wallet.accountId)
  if (account instanceof Error) return account
  const accountLimits = getAccountLimits({ level: account.level })
  const { checkIntraledger } = AccountLimitsChecker(accountLimits)

  return checkIntraledger({
    amount,
    volumeInWalletCurrency,
  })
}

export const newCheckWithdrawalLimits = async ({
  amount,
  wallet,
}: {
  amount: UsdPaymentAmount
  wallet: Wallet
}) => {
  const timestamp1Day = new Date(Date.now() - MS_PER_DAY)
  const walletVolume = await ledger.externalPaymentVolumeSince({
    walletId: wallet.id,
    timestamp: timestamp1Day,
  })
  if (walletVolume instanceof Error) return walletVolume
  const volumeInWalletCurrency = BigInt(walletVolume.outgoingBaseAmount)

  const account = await AccountsRepository().findById(wallet.accountId)
  if (account instanceof Error) return account
  const accountLimits = getAccountLimits({ level: account.level })
  const { checkWithdrawal } = AccountLimitsChecker(accountLimits)

  return checkWithdrawal({
    amount,
    volumeInWalletCurrency,
  })
}

export const newCheckTwoFALimits = async ({
  amount,
  wallet,
}: {
  amount: UsdPaymentAmount
  wallet: Wallet
}) => {
  const timestamp1Day = new Date(Date.now() - MS_PER_DAY)
  const walletVolume = await ledger.allTxBaseVolumeSince({
    walletId: wallet.id,
    timestamp: timestamp1Day,
  })
  if (walletVolume instanceof Error) return walletVolume
  const volumeInWalletCurrency = BigInt(walletVolume.outgoingBaseAmount)

  const twoFALimits = getTwoFALimits()
  const { checkTwoFA } = TwoFALimitsChecker(twoFALimits)

  return checkTwoFA({
    amount,
    volumeInWalletCurrency,
  })
}
