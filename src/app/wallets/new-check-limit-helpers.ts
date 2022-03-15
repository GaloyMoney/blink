import { usdFromBtcMidPriceFn } from "@app/payments/helpers"
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

  const account = await AccountsRepository().findById(wallet.accountId)
  if (account instanceof Error) return account

  const accountLimits = getAccountLimits({ level: account.level })
  const { checkIntraledger } = AccountLimitsChecker({
    accountLimits,
    usdFromBtcMidPriceFn,
  })

  return checkIntraledger({
    amount,
    walletVolume,
    walletCurrency: wallet.currency,
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

  const account = await AccountsRepository().findById(wallet.accountId)
  if (account instanceof Error) return account
  const accountLimits = getAccountLimits({ level: account.level })
  const { checkWithdrawal } = AccountLimitsChecker({
    accountLimits,
    usdFromBtcMidPriceFn,
  })

  return checkWithdrawal({
    amount,
    walletVolume,
    walletCurrency: wallet.currency,
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
  const twoFALimits = getTwoFALimits()
  const { checkTwoFA } = TwoFALimitsChecker({ twoFALimits, usdFromBtcMidPriceFn })

  return checkTwoFA({
    amount,
    walletVolume,
    walletCurrency: wallet.currency,
  })
}
