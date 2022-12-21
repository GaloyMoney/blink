import { getAccountLimits } from "@config"
import {
  InvalidAccountLimitTypeError,
  MismatchedLimitTypeForLimitCheckError,
} from "@domain/errors"
import {
  AmountCalculator,
  paymentAmountFromNumber,
  WalletCurrency,
  ZERO_CENTS,
} from "@domain/shared"
import { addAttributesToCurrentSpan } from "@services/tracing"

import { AccountLimitsType } from "./primitives"

const calc = AmountCalculator()

export const getAccountLimitsFromConfig = ({
  level,
  limitType,
}: {
  level: AccountLevel
  limitType: AccountLimitsType
}): UsdPaymentAmount | ValidationError => {
  const config = getAccountLimits({ level })

  let amount: UsdCents
  switch (limitType) {
    case AccountLimitsType.IntraLedger:
      amount = config.intraLedgerLimit
      break
    case AccountLimitsType.Withdrawal:
      amount = config.withdrawalLimit
      break
    case AccountLimitsType.SelfTrade:
      amount = config.tradeIntraAccountLimit
      break
    default:
      return new InvalidAccountLimitTypeError(limitType)
  }

  return paymentAmountFromNumber({ amount, currency: WalletCurrency.Usd })
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
  async (walletVolumes: TxLimitVolumeAmount<WalletCurrency>[]) => {
    for (const walletVolume of walletVolumes) {
      if (limitType !== walletVolume.limitType) {
        return new MismatchedLimitTypeForLimitCheckError()
      }
    }

    addAttributesToCurrentSpan({
      "txVolume.limitCheck": limitType,
    })

    const limitAmount = await getAccountLimitsFromConfig({ level, limitType })
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
