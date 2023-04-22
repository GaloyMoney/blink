import {
  IntraledgerLimitsExceededError,
  TradeIntraAccountLimitsExceededError,
  WithdrawalLimitsExceededError,
} from "@domain/errors"
import {
  AmountCalculator,
  paymentAmountFromNumber,
  WalletCurrency,
  ZERO_CENTS,
} from "@domain/shared"
import { addAttributesToCurrentSpan } from "@services/tracing"

import { calculateLimitsInUsd } from "./limits-volume"
import { AccountLimitsType } from "./primitives"

const calc = AmountCalculator()

const checkLimit =
  ({
    limitName,
    limitAmount: limit,
    limitError,
    priceRatio,
  }: {
    limitName: AccountLimitsType
    limitAmount: UsdCents
    limitError: LimitsExceededErrorConstructor
    priceRatio: WalletPriceRatio
  }) =>
  async ({
    amount,
    walletVolumes,
  }: LimiterCheckInputs): Promise<true | LimitsExceededError> => {
    let volumeInUsdAmount = ZERO_CENTS
    for (const walletVolume of walletVolumes) {
      const outgoingUsdAmount =
        walletVolume.outgoingBaseAmount.currency === WalletCurrency.Btc
          ? priceRatio.convertFromBtc(walletVolume.outgoingBaseAmount as BtcPaymentAmount)
          : (walletVolume.outgoingBaseAmount as UsdPaymentAmount)

      volumeInUsdAmount = calc.add(volumeInUsdAmount, outgoingUsdAmount)
    }

    const limitAmount = paymentAmountFromNumber({
      amount: limit,
      currency: WalletCurrency.Usd,
    })
    if (limitAmount instanceof Error) return limitAmount

    addAttributesToCurrentSpan({
      "txVolume.amountInBase": `${amount.amount}`,
    })

    const { volumeRemaining } = await calculateLimitsInUsd({
      limitName,
      limitAmount,
      priceRatio,

      walletVolumes,
    })

    const limitAsUsd = `$${(limit / 100).toFixed(2)}`
    const limitErrMsg = `Cannot transfer more than ${limitAsUsd} in 24 hours`

    return volumeRemaining.amount < amount.amount ? new limitError(limitErrMsg) : true
  }

export const AccountLimitsChecker = ({
  accountLimits,
  priceRatio,
}: {
  accountLimits: IAccountLimits
  priceRatio: WalletPriceRatio
}): AccountLimitsChecker => ({
  checkIntraledger: checkLimit({
    limitName: AccountLimitsType.IntraLedger,
    limitAmount: accountLimits.intraLedgerLimit,
    limitError: IntraledgerLimitsExceededError,
    priceRatio,
  }),
  checkWithdrawal: checkLimit({
    limitName: AccountLimitsType.Withdrawal,
    limitAmount: accountLimits.withdrawalLimit,
    limitError: WithdrawalLimitsExceededError,
    priceRatio,
  }),
  checkTradeIntraAccount: checkLimit({
    limitName: AccountLimitsType.SelfTrade,
    limitAmount: accountLimits.tradeIntraAccountLimit,
    limitError: TradeIntraAccountLimitsExceededError,
    priceRatio,
  }),
})
