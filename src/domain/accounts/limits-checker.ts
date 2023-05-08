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

import { LimitTimeframe, calculateLimitsInUsd } from "./limits-volume"
import { AccountLimitsType } from "./primitives"

const calc = AmountCalculator()

const checkLimit =
  ({
    limitName,
    limitAmounts,
    limitError,
    priceRatio,
  }: {
    limitName: AccountLimitsType
    limitAmounts: LimitAllTimeframe
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

    addAttributesToCurrentSpan({
      "txVolume.amountInBase": `${amount.amount}`,
    })

    for (const limitTimeframe of Object.keys(LimitTimeframe) as LimitTimeframe[]) {
      const limit = limitAmounts[limitTimeframe]
      const limitAmount = paymentAmountFromNumber({
        amount: limit,
        currency: WalletCurrency.Usd,
      })
      if (limitAmount instanceof Error) return limitAmount

      const { volumeRemaining } = await calculateLimitsInUsd({
        limitTimeframe,
        limitName,
        limitAmount,
        priceRatio,

        walletVolumes,
      })

      if (volumeRemaining.amount < amount.amount) {
        const limitAsUsd = `$${(limit / 100).toFixed(2)}`
        const limitErrMsg = `Cannot transfer more than ${limitAsUsd} in ${limitTimeframe}`

        return new limitError(limitErrMsg)
      }
    }

    return true
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
    limitAmounts: accountLimits.intraLedgerLimit,
    limitError: IntraledgerLimitsExceededError,
    priceRatio,
  }),
  checkWithdrawal: checkLimit({
    limitName: AccountLimitsType.Withdrawal,
    limitAmounts: accountLimits.withdrawalLimit,
    limitError: WithdrawalLimitsExceededError,
    priceRatio,
  }),
  checkTradeIntraAccount: checkLimit({
    limitName: AccountLimitsType.SelfTrade,
    limitAmounts: accountLimits.tradeIntraAccountLimit,
    limitError: TradeIntraAccountLimitsExceededError,
    priceRatio,
  }),
})
