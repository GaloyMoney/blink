import { getAccountLimits } from "@config"
import { InvalidAccountLimitTypeError } from "@domain/errors"
import {
  AmountCalculator,
  paymentAmountFromNumber,
  WalletCurrency,
  ZERO_CENTS,
} from "@domain/shared"
import { addAttributesToCurrentSpan } from "@services/tracing"

import { AccountLimitsType } from "./primitives"

const calc = AmountCalculator()

export const getAccountLimitsFromConfig = async ({
  level,
  limitType,
}: {
  level: AccountLevel
  limitType: AccountLimitsType
}) => {
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

export const calculateLimitsInUsd = async ({
  limitAmount,
  priceRatio,

  walletVolumes,
}: {
  limitAmount: UsdPaymentAmount
  priceRatio: PriceRatio
  walletVolumes: TxBaseVolumeAmount<WalletCurrency>[]
}): Promise<{
  volumeTotalLimit: UsdPaymentAmount
  volumeUsed: UsdPaymentAmount
  volumeRemaining: UsdPaymentAmount
}> => {
  let volumeInUsdAmount = ZERO_CENTS
  for (const walletVolume of walletVolumes) {
    const outgoingUsdAmount =
      walletVolume.outgoingBaseAmount.currency === WalletCurrency.Btc
        ? await priceRatio.convertFromBtc(
            walletVolume.outgoingBaseAmount as BtcPaymentAmount,
          )
        : (walletVolume.outgoingBaseAmount as UsdPaymentAmount)

    volumeInUsdAmount = calc.add(volumeInUsdAmount, outgoingUsdAmount)
  }

  addAttributesToCurrentSpan({
    "txVolume.outgoingInBase": `${volumeInUsdAmount.amount}`,
    "txVolume.threshold": `${limitAmount.amount}`,
  })

  return {
    volumeTotalLimit: limitAmount,
    volumeUsed: volumeInUsdAmount,
    volumeRemaining: calc.sub(limitAmount, volumeInUsdAmount),
  }
}

const volumesForLimit =
  ({
    level,
    limitType,
    priceRatio,
  }: {
    level: AccountLevel
    limitType: AccountLimitsType
    priceRatio: PriceRatio
  }) =>
  async (walletVolumes: TxBaseVolumeAmount<WalletCurrency>[]) => {
    addAttributesToCurrentSpan({
      "txVolume.limitCheck": limitType,
    })

    const limit = await getAccountLimitsFromConfig({ level, limitType })
    if (limit instanceof Error) return limit

    const limitAmount = paymentAmountFromNumber({
      amount: limit,
      currency: WalletCurrency.Usd,
    })
    if (limitAmount instanceof Error) return limitAmount

    return calculateLimitsInUsd({
      limitAmount,
      priceRatio,

      walletVolumes,
    })
  }

export const AccountLimitsVolumes = ({
  level,
  priceRatio,
}: {
  level: AccountLevel
  priceRatio: PriceRatio
}): AccountLimitsVolumes => ({
  volumesIntraledger: volumesForLimit({
    level,
    limitType: AccountLimitsType.IntraLedger,
    priceRatio,
  }),
  volumesWithdrawal: volumesForLimit({
    level,
    limitType: AccountLimitsType.Withdrawal,
    priceRatio,
  }),
  volumesTradeIntraAccount: volumesForLimit({
    level,
    limitType: AccountLimitsType.SelfTrade,
    priceRatio,
  }),
})

export const TwoFALimitsVolumes = ({
  level,
  priceRatio,
}: {
  level: AccountLevel
  priceRatio: PriceRatio
}): TwoFALimitsVolumes => ({
  volumesTwoFA: volumesForLimit({
    level,
    limitType: AccountLimitsType.TwoFA,
    priceRatio,
  }),
})
