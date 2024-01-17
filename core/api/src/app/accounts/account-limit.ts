import { getAccountLimits, ONE_DAY } from "@/config"

import {
  AccountLimitsType,
  AccountTxVolumeLimitChecker,
  AccountTxVolumeRemaining,
} from "@/domain/accounts"
import { InvalidAccountLimitTypeError } from "@/domain/errors"

import * as LedgerFacade from "@/services/ledger/facade"
import { AccountsRepository, WalletsRepository } from "@/services/mongoose"

import { timestampDaysAgo } from "@/utils"

export const remainingIntraLedgerLimit = async ({
  accountId,
  priceRatio,
}: {
  accountId: AccountId
  priceRatio: WalletPriceRatio
}) => {
  const timestamp1Day = timestampDaysAgo(ONE_DAY)
  if (timestamp1Day instanceof Error) return timestamp1Day

  const accountWalletDescriptors =
    await WalletsRepository().findAccountWalletsByAccountId(accountId)
  if (accountWalletDescriptors instanceof Error) return accountWalletDescriptors

  const btcWalletVolume = await LedgerFacade.outIntraledgerTxBaseVolumeAmountSince({
    walletDescriptor: accountWalletDescriptors.BTC,
    timestamp: timestamp1Day,
  })
  if (btcWalletVolume instanceof Error) return btcWalletVolume

  const usdWalletVolume = await LedgerFacade.outIntraledgerTxBaseVolumeAmountSince({
    walletDescriptor: accountWalletDescriptors.USD,
    timestamp: timestamp1Day,
  })
  if (usdWalletVolume instanceof Error) return usdWalletVolume

  const account = await AccountsRepository().findById(accountId)
  if (account instanceof Error) return account
  const accountLimits = getAccountLimits({ level: account.level })
  return AccountTxVolumeRemaining(accountLimits).intraLedger({
    priceRatio,
    outWalletVolumes: [btcWalletVolume, usdWalletVolume],
  })
}

export const checkIntraledgerLimits = async ({
  amount,
  accountId,
  priceRatio,
}: {
  amount: UsdPaymentAmount
  accountId: AccountId
  priceRatio: WalletPriceRatio
}) => {
  const volumeRemaining = await remainingIntraLedgerLimit({
    accountId,
    priceRatio,
  })
  if (volumeRemaining instanceof Error) return volumeRemaining

  const account = await AccountsRepository().findById(accountId)
  if (account instanceof Error) return account
  const accountLimits = getAccountLimits({ level: account.level })
  return AccountTxVolumeLimitChecker(accountLimits).checkIntraledger({
    amount,
    volumeRemaining,
  })
}

export const remainingWithdrawalLimit = async ({
  accountId,
  priceRatio,
}: {
  accountId: AccountId
  priceRatio: WalletPriceRatio
}) => {
  const timestamp1Day = timestampDaysAgo(ONE_DAY)
  if (timestamp1Day instanceof Error) return timestamp1Day

  const accountWalletDescriptors =
    await WalletsRepository().findAccountWalletsByAccountId(accountId)
  if (accountWalletDescriptors instanceof Error) return accountWalletDescriptors

  const btcWalletVolume = await LedgerFacade.netOutExternalPaymentVolumeAmountSince({
    walletDescriptor: accountWalletDescriptors.BTC,
    timestamp: timestamp1Day,
  })
  if (btcWalletVolume instanceof Error) return btcWalletVolume

  const usdWalletVolume = await LedgerFacade.netOutExternalPaymentVolumeAmountSince({
    walletDescriptor: accountWalletDescriptors.USD,
    timestamp: timestamp1Day,
  })
  if (usdWalletVolume instanceof Error) return usdWalletVolume

  const account = await AccountsRepository().findById(accountId)
  if (account instanceof Error) return account
  const accountLimits = getAccountLimits({ level: account.level })
  return AccountTxVolumeRemaining(accountLimits).withdrawal({
    priceRatio,
    netOutWalletVolumes: [btcWalletVolume, usdWalletVolume],
  })
}

export const checkWithdrawalLimits = async ({
  amount,
  accountId,
  priceRatio,
}: {
  amount: UsdPaymentAmount
  accountId: AccountId
  priceRatio: WalletPriceRatio
}) => {
  const volumeRemaining = await remainingWithdrawalLimit({ accountId, priceRatio })
  if (volumeRemaining instanceof Error) return volumeRemaining

  const account = await AccountsRepository().findById(accountId)
  if (account instanceof Error) return account
  const accountLimits = getAccountLimits({ level: account.level })
  return AccountTxVolumeLimitChecker(accountLimits).checkWithdrawal({
    amount,
    volumeRemaining,
  })
}

export const remainingTradeIntraAccountLimit = async ({
  accountId,
  priceRatio,
}: {
  accountId: AccountId
  priceRatio: WalletPriceRatio
}) => {
  const timestamp1Day = timestampDaysAgo(ONE_DAY)
  if (timestamp1Day instanceof Error) return timestamp1Day

  const accountWalletDescriptors =
    await WalletsRepository().findAccountWalletsByAccountId(accountId)
  if (accountWalletDescriptors instanceof Error) return accountWalletDescriptors

  const btcWalletVolume = await LedgerFacade.outTradeIntraAccountTxBaseVolumeAmountSince({
    walletDescriptor: accountWalletDescriptors.BTC,
    timestamp: timestamp1Day,
  })
  if (btcWalletVolume instanceof Error) return btcWalletVolume

  const usdWalletVolume = await LedgerFacade.outTradeIntraAccountTxBaseVolumeAmountSince({
    walletDescriptor: accountWalletDescriptors.USD,
    timestamp: timestamp1Day,
  })
  if (usdWalletVolume instanceof Error) return usdWalletVolume

  const account = await AccountsRepository().findById(accountId)
  if (account instanceof Error) return account
  const accountLimits = getAccountLimits({ level: account.level })
  return AccountTxVolumeRemaining(accountLimits).tradeIntraAccount({
    priceRatio,
    outWalletVolumes: [btcWalletVolume, usdWalletVolume],
  })
}

export const checkTradeIntraAccountLimits = async ({
  amount,
  accountId,
  priceRatio,
}: {
  amount: UsdPaymentAmount
  accountId: AccountId
  priceRatio: WalletPriceRatio
}) => {
  const volumeRemaining = await remainingTradeIntraAccountLimit({
    accountId,
    priceRatio,
  })
  if (volumeRemaining instanceof Error) return volumeRemaining

  const account = await AccountsRepository().findById(accountId)
  if (account instanceof Error) return account
  const accountLimits = getAccountLimits({ level: account.level })
  return AccountTxVolumeLimitChecker(accountLimits).checkTradeIntraAccount({
    amount,
    volumeRemaining,
  })
}

export const totalLimit = async ({
  level,
  limitType,
}: {
  level: AccountLevel
  limitType: AccountLimitsType
}): Promise<UsdCents | ApplicationError> => {
  const config = getAccountLimits({ level })
  switch (limitType) {
    case AccountLimitsType.IntraLedger:
      return config.intraLedgerLimit
    case AccountLimitsType.Withdrawal:
      return config.withdrawalLimit
    case AccountLimitsType.SelfTrade:
      return config.tradeIntraAccountLimit
    default:
      return new InvalidAccountLimitTypeError(limitType)
  }
}
