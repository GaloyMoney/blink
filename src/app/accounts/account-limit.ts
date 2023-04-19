import { volumesForAccountId } from "@app/payments/helpers"
import { getMidPriceRatio } from "@app/prices"
import { getAccountLimits, getDealerConfig, ONE_DAY, THIRTY_DAY } from "@config"
import { AccountLimitsType } from "@domain/accounts"
import { AccountLimitsVolumes, LimitTimeframe } from "@domain/accounts/limits-volume"
import { InvalidAccountLimitTypeError } from "@domain/errors"
import { LedgerService } from "@services/ledger"

const limitTimeframeToSecondsSince = (timeframe: LimitTimeframe) => {
  switch (timeframe) {
    case LimitTimeframe["24h"]:
      return ONE_DAY
    case LimitTimeframe["30d"]:
      return THIRTY_DAY
  }
}

export const remainingLimit = async ({
  limitTimeframe,
  account,
  limitType,
}: {
  limitTimeframe: LimitTimeframe
  account: Account
  limitType: AccountLimitsType
}): Promise<UsdPaymentAmount | ApplicationError> => {
  const usdHedgeEnabled = getDealerConfig().usd.hedgingEnabled

  const priceRatio = await getMidPriceRatio(usdHedgeEnabled)
  if (priceRatio instanceof Error) return priceRatio

  const accountLimits = getAccountLimits({ level: account.level })

  const accountVolumes = AccountLimitsVolumes({
    accountLimits,
    priceRatio,
    limitTimeframe,
  })
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

  const period = limitTimeframeToSecondsSince(limitTimeframe)

  const walletVolumes = await volumesForAccountId({
    accountId: account.id,
    period,
    volumeAmountSinceFn: getVolumeFn,
  })
  if (walletVolumes instanceof Error) return walletVolumes

  const limitVolumes = await limitsVolumeFn(walletVolumes)
  if (limitVolumes instanceof Error) return limitVolumes

  return limitVolumes.volumeRemaining
}

export const totalLimit = async ({
  limitTimeframe,
  level,
  limitType,
}: {
  limitTimeframe: LimitTimeframe
  level: AccountLevel
  limitType: AccountLimitsType
}): Promise<UsdCents | ApplicationError> => {
  const config = getAccountLimits({ level })
  switch (limitType) {
    case AccountLimitsType.IntraLedger:
      return config.intraLedgerLimit[limitTimeframe]
    case AccountLimitsType.Withdrawal:
      return config.withdrawalLimit[limitTimeframe]
    case AccountLimitsType.SelfTrade:
      return config.tradeIntraAccountLimit[limitTimeframe]
    default:
      return new InvalidAccountLimitTypeError(limitType)
  }
}
