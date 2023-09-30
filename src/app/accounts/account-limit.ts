import { getMidPriceRatio } from "@app/prices"

import { getAccountLimits, getDealerConfig, ONE_DAY } from "@config"

import { AccountLimitsType } from "@domain/accounts"
import {
  intraledgerVolumeRemaining,
  tradeIntraAccountVolumeRemaining,
  withdrawalVolumeRemaining,
} from "@domain/accounts/limits-volume"
import { InvalidAccountLimitTypeError } from "@domain/errors"

import * as LedgerFacade from "@services/ledger/facade"
import { WalletsRepository } from "@services/mongoose"

export const remainingIntraLedgerLimit = async (account: Account) => {
  const accountWalletDescriptors =
    await WalletsRepository().findAccountWalletsByAccountId(account.id)
  if (accountWalletDescriptors instanceof Error) return accountWalletDescriptors

  const walletVolumes = await LedgerFacade.intraledgerTxBaseVolumeAmountForAccountSince({
    accountWalletDescriptors,
    period: ONE_DAY,
  })

  if (walletVolumes instanceof Error) return walletVolumes

  const usdHedgeEnabled = getDealerConfig().usd.hedgingEnabled
  const priceRatio = await getMidPriceRatio(usdHedgeEnabled)
  if (priceRatio instanceof Error) return priceRatio

  const accountLimits = getAccountLimits({ level: account.level })

  const limitVolumes = await intraledgerVolumeRemaining({
    accountLimits,
    priceRatio,
    walletVolumes,
  })
  if (limitVolumes instanceof Error) return limitVolumes

  return limitVolumes
}

export const remainingWithdrawalLimit = async (account: Account) => {
  const accountWalletDescriptors =
    await WalletsRepository().findAccountWalletsByAccountId(account.id)
  if (accountWalletDescriptors instanceof Error) return accountWalletDescriptors

  const walletVolumes = await LedgerFacade.externalPaymentVolumeAmountForAccountSince({
    accountWalletDescriptors,
    period: ONE_DAY,
  })

  if (walletVolumes instanceof Error) return walletVolumes

  const usdHedgeEnabled = getDealerConfig().usd.hedgingEnabled
  const priceRatio = await getMidPriceRatio(usdHedgeEnabled)
  if (priceRatio instanceof Error) return priceRatio

  const accountLimits = getAccountLimits({ level: account.level })

  const limitVolumes = await withdrawalVolumeRemaining({
    accountLimits,
    priceRatio,
    walletVolumes,
  })
  if (limitVolumes instanceof Error) return limitVolumes

  return limitVolumes
}

export const remainingTradeIntraAccountLimit = async (account: Account) => {
  const accountWalletDescriptors =
    await WalletsRepository().findAccountWalletsByAccountId(account.id)
  if (accountWalletDescriptors instanceof Error) return accountWalletDescriptors

  const walletVolumes =
    await LedgerFacade.tradeIntraAccountTxBaseVolumeAmountForAccountSince({
      accountWalletDescriptors,
      period: ONE_DAY,
    })

  if (walletVolumes instanceof Error) return walletVolumes

  const usdHedgeEnabled = getDealerConfig().usd.hedgingEnabled
  const priceRatio = await getMidPriceRatio(usdHedgeEnabled)
  if (priceRatio instanceof Error) return priceRatio

  const accountLimits = getAccountLimits({ level: account.level })

  const limitVolumes = await tradeIntraAccountVolumeRemaining({
    accountLimits,
    priceRatio,
    walletVolumes,
  })
  if (limitVolumes instanceof Error) return limitVolumes

  return limitVolumes
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
