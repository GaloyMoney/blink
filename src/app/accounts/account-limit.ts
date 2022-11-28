import { volumesForAccountId } from "@app/payments/helpers"
import { getMidPriceRatio } from "@app/shared"
import { getAccountLimits, getDealerConfig, ONE_DAY } from "@config"
import { AccountLimitsVolumes } from "@domain/accounts/limits-volume"
import { InvalidAccountLimitTypeError } from "@domain/errors"
import { LedgerService } from "@services/ledger"

export const accountLimit = async ({
  account,
  limitType,
}: {
  account: Account
  limitType: "Intraledger" | "Withdrawal" | "TradeIntraAccount"
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

  const accountLimits = getAccountLimits({ level: account.level })

  const accountVolumes = AccountLimitsVolumes({ accountLimits, priceRatio })
  if (accountVolumes instanceof Error) return accountVolumes

  const ledger = LedgerService()

  let limitsVolumeFn: LimitsVolumesFn
  let getVolumeFn: GetVolumeAmountSinceFn
  switch (limitType) {
    case "Intraledger":
      limitsVolumeFn = accountVolumes.volumesIntraledger
      getVolumeFn = ledger.intraledgerTxBaseVolumeAmountSince
      break
    case "Withdrawal":
      limitsVolumeFn = accountVolumes.volumesWithdrawal
      getVolumeFn = ledger.externalPaymentVolumeAmountSince
      break
    case "TradeIntraAccount":
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

export const getAccountLimitsFromConfig = async ({
  level,
  limitType,
}: {
  level: AccountLevel
  limitType: "Withdrawal" | "Intraledger" | "TradeIntraAccount"
}) => {
  const config = getAccountLimits({ level })
  switch (limitType) {
    case "Intraledger":
      return config.intraLedgerLimit
    case "Withdrawal":
      return config.withdrawalLimit
    case "TradeIntraAccount":
      return config.tradeIntraAccountLimit
    default:
      return new InvalidAccountLimitTypeError(limitType)
  }
}
