import {
  IntraledgerLimitsExceededError,
  InvalidAccountLimitTypeError,
  MismatchedLimitTypeForLimitCheckError,
  TradeIntraAccountLimitsExceededError,
  TwoFALimitsExceededError,
  WithdrawalLimitsExceededError,
} from "@domain/errors"
import {
  AmountCalculator,
  paymentAmountFromNumber,
  WalletCurrency,
  ZERO_CENTS,
} from "@domain/shared"
import { addAttributesToCurrentSpan } from "@services/tracing"

import { calculateLimitsInUsd, getAccountLimitsFromConfig } from "./limits-volume"
import { AccountLimitsType } from "./primitives"

const calc = AmountCalculator()

const checkLimitBase =
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

    const limit = await getAccountLimitsFromConfig({ level, limitType })
    if (limit instanceof Error) return limit

    const limitAmount = paymentAmountFromNumber({
      amount: limit,
      currency: WalletCurrency.Usd,
    })
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

    const limitErrMsg = `Cannot transfer more than ${limit} cents in 24 hours`

    return volumeRemaining.amount < amount.amount ? new limitError(limitErrMsg) : true
  }

export const AccountLimitsChecker = ({
  level,
  priceRatio,
}: {
  level: AccountLevel
  priceRatio: PriceRatio
}): AccountLimitsChecker => ({
  checkIntraledger: checkLimitBase({
    level,
    limitType: AccountLimitsType.IntraLedger,
    priceRatio,
  }),
  checkWithdrawal: checkLimitBase({
    level,
    limitType: AccountLimitsType.Withdrawal,
    priceRatio,
  }),
  checkTradeIntraAccount: checkLimitBase({
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
  checkTwoFA: checkLimitBase({
    level,
    limitType: AccountLimitsType.TwoFA,
    priceRatio,
  }),
})
