import { getMidPriceRatio } from "@app/prices"

import { getAccountLimits, getDealerConfig, ONE_DAY } from "@config"

import { AccountLimitsType } from "@domain/accounts"
import { AccountLimitsVolumes } from "@domain/accounts/limits-volume"
import { InvalidAccountLimitTypeError } from "@domain/errors"

import * as LedgerFacade from "@services/ledger/facade"
import { WalletsRepository } from "@services/mongoose"

export const remainingLimit = async ({
  account,
  limitType,
}: {
  account: Account
  limitType: AccountLimitsType
}): Promise<UsdPaymentAmount | ApplicationError> => {
  const usdHedgeEnabled = getDealerConfig().usd.hedgingEnabled

  const priceRatio = await getMidPriceRatio(usdHedgeEnabled)
  if (priceRatio instanceof Error) return priceRatio

  const accountLimits = getAccountLimits({ level: account.level })

  const accountVolumes = AccountLimitsVolumes({ accountLimits, priceRatio })
  if (accountVolumes instanceof Error) return accountVolumes

  let limitsVolumeFn: LimitsVolumesFn
  let getVolumeFn: GetVolumeAmountForAccountSinceFn
  switch (limitType) {
    case AccountLimitsType.IntraLedger:
      limitsVolumeFn = accountVolumes.volumesIntraledger
      getVolumeFn = LedgerFacade.intraledgerTxBaseVolumeAmountForAccountSince
      break
    case AccountLimitsType.Withdrawal:
      limitsVolumeFn = accountVolumes.volumesWithdrawal
      getVolumeFn = LedgerFacade.externalPaymentVolumeAmountForAccountSince
      break
    case AccountLimitsType.SelfTrade:
      limitsVolumeFn = accountVolumes.volumesTradeIntraAccount
      getVolumeFn = LedgerFacade.tradeIntraAccountTxBaseVolumeAmountForAccountSince
      break
    default:
      return new InvalidAccountLimitTypeError(limitType)
  }

  const accountWalletDescriptors =
    await WalletsRepository().findAccountWalletsByAccountId(account.id)
  if (accountWalletDescriptors instanceof Error) return accountWalletDescriptors
  const walletVolumes = await getVolumeFn({
    accountWalletDescriptors,
    period: ONE_DAY,
  })
  if (walletVolumes instanceof Error) return walletVolumes

  const limitVolumes = await limitsVolumeFn(walletVolumes)
  if (limitVolumes instanceof Error) return limitVolumes

  return limitVolumes.volumeRemaining
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
