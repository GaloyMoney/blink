import {
  IntraledgerLimitsExceededError,
  TradeIntraAccountLimitsExceededError,
  WithdrawalLimitsExceededError,
} from "@domain/errors"

import {
  intraledgerVolumeRemaining,
  tradeIntraAccountVolumeRemaining,
  withdrawalVolumeRemaining,
} from "./limits-volume"

export const checkIntraledger = async ({
  accountLimits,
  priceRatio,
  amount,
  walletVolumes,
}: {
  accountLimits: IAccountLimits
  priceRatio: WalletPriceRatio
  amount: UsdPaymentAmount
  walletVolumes: TxBaseVolumeAmount<WalletCurrency>[]
}) => {
  const volumeRemaining = await intraledgerVolumeRemaining({
    accountLimits,
    priceRatio,
    walletVolumes,
  })
  if (volumeRemaining instanceof Error) return volumeRemaining

  const limitAsUsd = `$${(accountLimits.intraLedgerLimit / 100).toFixed(2)}`
  const limitErrMsg = `Cannot transfer more than ${limitAsUsd} in 24 hours`

  return volumeRemaining.amount >= amount.amount
    ? true
    : new IntraledgerLimitsExceededError(limitErrMsg)
}

export const checkWithdrawal = async ({
  accountLimits,
  priceRatio,
  amount,
  walletVolumes,
}: {
  accountLimits: IAccountLimits
  priceRatio: WalletPriceRatio
  amount: UsdPaymentAmount
  walletVolumes: TxBaseVolumeAmount<WalletCurrency>[]
}) => {
  const volumeRemaining = await withdrawalVolumeRemaining({
    accountLimits,
    priceRatio,
    walletVolumes,
  })
  if (volumeRemaining instanceof Error) return volumeRemaining

  const limitAsUsd = `$${(accountLimits.withdrawalLimit / 100).toFixed(2)}`
  const limitErrMsg = `Cannot transfer more than ${limitAsUsd} in 24 hours`

  return volumeRemaining.amount >= amount.amount
    ? true
    : new WithdrawalLimitsExceededError(limitErrMsg)
}

export const checkTradeIntraAccount = async ({
  accountLimits,
  priceRatio,
  amount,
  walletVolumes,
}: {
  accountLimits: IAccountLimits
  priceRatio: WalletPriceRatio
  amount: UsdPaymentAmount
  walletVolumes: TxBaseVolumeAmount<WalletCurrency>[]
}) => {
  const volumeRemaining = await tradeIntraAccountVolumeRemaining({
    accountLimits,
    priceRatio,
    walletVolumes,
  })
  if (volumeRemaining instanceof Error) return volumeRemaining

  const limitAsUsd = `$${(accountLimits.tradeIntraAccountLimit / 100).toFixed(2)}`
  const limitErrMsg = `Cannot transfer more than ${limitAsUsd} in 24 hours`

  return volumeRemaining.amount >= amount.amount
    ? true
    : new TradeIntraAccountLimitsExceededError(limitErrMsg)
}
