import {
  IntraledgerLimitsExceededError,
  TradeIntraAccountLimitsExceededError,
  TwoFALimitsExceededError,
  WithdrawalLimitsExceededError,
} from "@domain/errors"
import { paymentAmountFromNumber, WalletCurrency } from "@domain/shared"
import { addAttributesToCurrentSpan } from "@services/tracing"

const checkLimitBase =
  ({
    limitName,
    limitAmount,
    limitError,
    limitErrMsg,
    priceRatio,
  }: {
    limitName:
      | "checkIntraledger"
      | "checkWithdrawal"
      | "checkTradeIntraAccount"
      | "checkTwoFA"
    limitAmount: UsdCents
    limitError: LimitsExceededErrorConstructor
    limitErrMsg: string | undefined
    priceRatio: PriceRatio
  }) =>
  async ({
    amount,
    walletVolume,
  }: NewLimiterCheckInputs): Promise<true | LimitsExceededError> => {
    const volumeInUsdAmount =
      walletVolume.outgoingBaseAmount.currency === WalletCurrency.Btc
        ? await priceRatio.convertFromBtc(
            walletVolume.outgoingBaseAmount as BtcPaymentAmount,
          )
        : (walletVolume.outgoingBaseAmount as UsdPaymentAmount)

    const limit = paymentAmountFromNumber({
      amount: limitAmount,
      currency: WalletCurrency.Usd,
    })
    if (limit instanceof Error) return limit
    addAttributesToCurrentSpan({
      "txVolume.outgoingInBase": `${volumeInUsdAmount.amount}`,
      "txVolume.threshold": `${limit.amount}`,
      "txVolume.amountInBase": `${amount.amount}`,
      "txVolume.limitCheck": limitName,
    })

    const remainingLimit = limit.amount - volumeInUsdAmount.amount
    if (remainingLimit < amount.amount) {
      return new limitError(limitErrMsg)
    }
    return true
  }

export const AccountLimitsChecker = ({
  accountLimits,
  priceRatio,
}: {
  accountLimits: IAccountLimits
  priceRatio: PriceRatio
}): AccountLimitsChecker => ({
  checkIntraledger: checkLimitBase({
    limitName: "checkIntraledger",
    limitAmount: accountLimits.intraLedgerLimit,
    limitError: IntraledgerLimitsExceededError,
    limitErrMsg: `Cannot transfer more than ${accountLimits.intraLedgerLimit} cents in 24 hours`,
    priceRatio,
  }),
  checkWithdrawal: checkLimitBase({
    limitName: "checkWithdrawal",
    limitAmount: accountLimits.withdrawalLimit,
    limitError: WithdrawalLimitsExceededError,
    limitErrMsg: `Cannot transfer more than ${accountLimits.withdrawalLimit} cents in 24 hours`,
    priceRatio,
  }),
  checkTradeIntraAccount: checkLimitBase({
    limitName: "checkTradeIntraAccount",
    limitAmount: accountLimits.tradeIntraAccountLimit,
    limitError: TradeIntraAccountLimitsExceededError,
    limitErrMsg: `Cannot transfer more than ${accountLimits.tradeIntraAccountLimit} cents in 24 hours`,
    priceRatio,
  }),
})

export const TwoFALimitsChecker = ({
  twoFALimits,
  priceRatio,
}: {
  twoFALimits: TwoFALimits
  priceRatio: PriceRatio
}): TwoFALimitsChecker => ({
  checkTwoFA: checkLimitBase({
    limitName: "checkTwoFA",
    limitAmount: twoFALimits.threshold,
    limitError: TwoFALimitsExceededError,
    limitErrMsg: undefined,
    priceRatio,
  }),
})
