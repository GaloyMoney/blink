import { getAccountLimits, ONE_DAY } from "@/config"

import {
  AccountLimitsType,
  AccountTxVolumeLimitChecker,
  AccountTxVolumeRemaining,
} from "@/domain/accounts"
import { InvalidAccountLimitTypeError } from "@/domain/errors"

import * as LedgerFacade from "@/services/ledger/facade"
import { AccountsRepository, WalletsRepository } from "@/services/mongoose"

export const remainingIntraLedgerLimit = async ({
  accountUuid,
  priceRatio,
}: {
  accountUuid: AccountUuid
  priceRatio: WalletPriceRatio
}) => {
  const account = await AccountsRepository().findByUuid(accountUuid)
  if (account instanceof Error) return account
  const accountLimits = getAccountLimits({ level: account.level })
  const accountVolumeRemaining = AccountTxVolumeRemaining(accountLimits)

  const accountWalletDescriptors =
    await WalletsRepository().findAccountWalletsByAccountUuid(accountUuid)
  if (accountWalletDescriptors instanceof Error) return accountWalletDescriptors

  const walletVolumes = await LedgerFacade.intraledgerTxBaseVolumeAmountForAccountSince({
    accountWalletDescriptors,
    period: ONE_DAY,
  })
  if (walletVolumes instanceof Error) return walletVolumes

  return accountVolumeRemaining.intraLedger({
    priceRatio,
    walletVolumes,
  })
}

export const checkIntraledgerLimits = async ({
  amount,
  accountUuid,
  priceRatio,
}: {
  amount: UsdPaymentAmount
  accountUuid: AccountUuid
  priceRatio: WalletPriceRatio
}) => {
  const account = await AccountsRepository().findByUuid(accountUuid)
  if (account instanceof Error) return account
  const accountLimits = getAccountLimits({ level: account.level })
  const accountLimitsChecker = AccountTxVolumeLimitChecker(accountLimits)

  const volumeRemaining = await remainingIntraLedgerLimit({ accountUuid, priceRatio })
  if (volumeRemaining instanceof Error) return volumeRemaining

  return accountLimitsChecker.checkIntraledger({
    amount,
    volumeRemaining,
  })
}

export const remainingWithdrawalLimit = async ({
  accountUuid,
  priceRatio,
}: {
  accountUuid: AccountUuid
  priceRatio: WalletPriceRatio
}) => {
  const account = await AccountsRepository().findByUuid(accountUuid)
  if (account instanceof Error) return account
  const accountLimits = getAccountLimits({ level: account.level })
  const accountVolumeRemaining = AccountTxVolumeRemaining(accountLimits)

  const accountWalletDescriptors =
    await WalletsRepository().findAccountWalletsByAccountUuid(accountUuid)
  if (accountWalletDescriptors instanceof Error) return accountWalletDescriptors

  const walletVolumes = await LedgerFacade.externalPaymentVolumeAmountForAccountSince({
    accountWalletDescriptors,
    period: ONE_DAY,
  })
  if (walletVolumes instanceof Error) return walletVolumes

  return accountVolumeRemaining.withdrawal({
    priceRatio,
    walletVolumes,
  })
}

export const checkWithdrawalLimits = async ({
  amount,
  accountUuid,
  priceRatio,
}: {
  amount: UsdPaymentAmount
  accountUuid: AccountUuid
  priceRatio: WalletPriceRatio
}) => {
  const account = await AccountsRepository().findByUuid(accountUuid)
  if (account instanceof Error) return account
  const accountLimits = getAccountLimits({ level: account.level })
  const accountLimitsChecker = AccountTxVolumeLimitChecker(accountLimits)

  const volumeRemaining = await remainingWithdrawalLimit({ accountUuid, priceRatio })
  if (volumeRemaining instanceof Error) return volumeRemaining

  return accountLimitsChecker.checkWithdrawal({
    amount,
    volumeRemaining,
  })
}

export const remainingTradeIntraAccountLimit = async ({
  accountUuid,
  priceRatio,
}: {
  accountUuid: AccountUuid
  priceRatio: WalletPriceRatio
}) => {
  const account = await AccountsRepository().findByUuid(accountUuid)
  if (account instanceof Error) return account
  const accountLimits = getAccountLimits({ level: account.level })
  const accountVolumeRemaining = AccountTxVolumeRemaining(accountLimits)

  const accountWalletDescriptors =
    await WalletsRepository().findAccountWalletsByAccountUuid(accountUuid)
  if (accountWalletDescriptors instanceof Error) return accountWalletDescriptors

  const walletVolumes =
    await LedgerFacade.tradeIntraAccountTxBaseVolumeAmountForAccountSince({
      accountWalletDescriptors,
      period: ONE_DAY,
    })
  if (walletVolumes instanceof Error) return walletVolumes

  return accountVolumeRemaining.tradeIntraAccount({
    priceRatio,
    walletVolumes,
  })
}

export const checkTradeIntraAccountLimits = async ({
  amount,
  accountUuid,
  priceRatio,
}: {
  amount: UsdPaymentAmount
  accountUuid: AccountUuid
  priceRatio: WalletPriceRatio
}) => {
  const account = await AccountsRepository().findByUuid(accountUuid)
  if (account instanceof Error) return account
  const accountLimits = getAccountLimits({ level: account.level })
  const accountLimitsChecker = AccountTxVolumeLimitChecker(accountLimits)

  const volumeRemaining = await remainingTradeIntraAccountLimit({
    accountUuid,
    priceRatio,
  })
  if (volumeRemaining instanceof Error) return volumeRemaining

  return accountLimitsChecker.checkTradeIntraAccount({
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
