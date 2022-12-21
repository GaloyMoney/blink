import { volumesForAccountId } from "@app/payments/helpers"
import { getMidPriceRatio } from "@app/shared"
import { getDealerConfig, ONE_DAY } from "@config"
import { AccountLimitsType, AccountLimitsVolumes } from "@domain/accounts"
import { InvalidAccountLimitTypeError } from "@domain/errors"
import { LedgerService } from "@services/ledger"

export const accountLimit = async ({
  account,
  limitType,
}: {
  account: Account
  limitType: AccountLimitsType
}): Promise<
  | {
      volumeTotalLimit: UsdPaymentAmount
      volumeUsed: UsdPaymentAmount
      volumeRemaining: UsdPaymentAmount
    }
  | ApplicationError
> => {
  const usdHedgeEnabled = getDealerConfig().usd.hedgingEnabled

  const priceRatio = await getMidPriceRatio(usdHedgeEnabled)
  if (priceRatio instanceof Error) return priceRatio

  const accountVolumes = AccountLimitsVolumes({ level: account.level, priceRatio })
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

  return limitsVolumeFn(walletVolumes)
}
