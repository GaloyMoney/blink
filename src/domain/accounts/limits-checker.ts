import {
  IntraledgerLimitsExceededError,
  InvalidAccountLimitTypeError,
  MismatchedLimitTypeForLimitCheckError,
  TradeIntraAccountLimitsExceededError,
  TwoFALimitsExceededError,
  WithdrawalLimitsExceededError,
} from "@domain/errors"
import { AmountCalculator, WalletCurrency, ZERO_CENTS } from "@domain/shared"
import { addAttributesToCurrentSpan } from "@services/tracing"

import { calculateLimitsInUsd, getAccountLimitsFromConfig } from "./limits-volume"
import { AccountLimitsType } from "./primitives"

const calc = AmountCalculator()

const checkLimit =
  ({
    level,
    limitType,
    priceRatio,
  }: {
    level: AccountLevel
    limitType: AccountLimitsType
    priceRatio: PriceRatio
  }) =>
  async ({
    amount,
    walletVolumes,
  }: LimiterCheckInputs): Promise<true | LimitsExceededError> => {
    let volumeInUsdAmount = ZERO_CENTS
    for (const walletVolume of walletVolumes) {
      if (limitType !== walletVolume.limitType) {
        return new MismatchedLimitTypeForLimitCheckError()
      }

      const outgoingUsdAmount =
        walletVolume.outgoingBaseAmount.currency === WalletCurrency.Btc
          ? await priceRatio.convertFromBtc(
              walletVolume.outgoingBaseAmount as BtcPaymentAmount,
            )
          : (walletVolume.outgoingBaseAmount as UsdPaymentAmount)

      volumeInUsdAmount = calc.add(volumeInUsdAmount, outgoingUsdAmount)
    }

    const limitAmount = await getAccountLimitsFromConfig({ level, limitType })
    if (limitAmount instanceof Error) return limitAmount

    addAttributesToCurrentSpan({
      "txVolume.amountInBase": `${amount.amount}`,
    })

    const { volumeRemaining } = await calculateLimitsInUsd({
      limitAmount,
      priceRatio,

      walletVolumes,
    })

    let limitError: LimitsExceededErrorConstructor
    switch (limitType) {
      case AccountLimitsType.IntraLedger:
        limitError = IntraledgerLimitsExceededError
        break
      case AccountLimitsType.Withdrawal:
        limitError = WithdrawalLimitsExceededError
        break
      case AccountLimitsType.SelfTrade:
        limitError = TradeIntraAccountLimitsExceededError
        break
      case AccountLimitsType.TwoFA:
        limitError = TwoFALimitsExceededError
        break
      default:
        return new InvalidAccountLimitTypeError(limitType)
    }

    const limitErrMsg = `Cannot transfer more than ${limitAmount.amount} cents in 24 hours`

    return volumeRemaining.amount < amount.amount ? new limitError(limitErrMsg) : true
  }

export const AccountLimitsChecker = ({
  level,
  priceRatio,
}: {
  level: AccountLevel
  priceRatio: PriceRatio
}): AccountLimitsChecker => ({
  checkIntraledger: checkLimit({
    level,
    limitType: AccountLimitsType.IntraLedger,
    priceRatio,
  }),
  checkWithdrawal: checkLimit({
    level,
    limitType: AccountLimitsType.Withdrawal,
    priceRatio,
  }),
  checkTradeIntraAccount: checkLimit({
    level,
    limitType: AccountLimitsType.SelfTrade,
    priceRatio,
  }),
})

export const TwoFALimitsChecker = ({
  level,
  priceRatio,
}: {
  level: AccountLevel
  priceRatio: PriceRatio
}): TwoFALimitsChecker => ({
  checkTwoFA: checkLimit({
    level,
    limitType: AccountLimitsType.TwoFA,
    priceRatio,
  }),
})
