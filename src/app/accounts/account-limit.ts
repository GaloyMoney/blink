import { volumesForAccountId } from "@app/payments/helpers"
import { getMidPriceRatio } from "@app/shared"
import { getAccountLimits, getDealerConfig, ONE_DAY } from "@config"
import { AccountLimitsType } from "@domain/accounts"
import { AccountLimitsVolumes } from "@domain/accounts/limits-volume"
import { InvalidAccountLimitTypeError } from "@domain/errors"
import { LedgerService } from "@services/ledger"

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

  const ledger = LedgerService()

  let limitsVolumeFn: LimitsVolumesFn
  let getVolumeFn: GetVolumeAmountSinceFn
  switch (limitType) {
    case AccountLimitsType.IntraLedger:
      limitsVolumeFn = accountVolumes.volumesIntraledger
      getVolumeFn = ledger.intraledgerTxBaseVolumeAmountSince
      break
    case AccountLimitsType.Withdrawal:
      limitsVolumeFn = accountVolumes.volumesWithdrawal
      getVolumeFn = ledger.externalPaymentVolumeAmountSince
      break
    case AccountLimitsType.SelfTrade:
      limitsVolumeFn = accountVolumes.volumesTradeIntraAccount
      getVolumeFn = ledger.tradeIntraAccountTxBaseVolumeAmountSince
      break
    default:
      return new InvalidAccountLimitTypeError(limitType)
  }

  const walletVolumes = await volumesForAccountId({
    accountId: account.id,
    period: ONE_DAY,
    volumeAmountSinceFn: getVolumeFn,
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
