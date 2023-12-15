import {
  IntraledgerLimitsExceededError,
  TradeIntraAccountLimitsExceededError,
  WithdrawalLimitsExceededError,
} from "@/domain/errors"

export const AccountTxVolumeLimitChecker = (
  accountLimits: IAccountLimits,
): IAccountTxVolumeLimitChecker => {
  const checkIntraledger = async ({
    amount,
    volumeRemaining,
  }: {
    amount: UsdPaymentAmount
    volumeRemaining: UsdPaymentAmount
  }) => {
    const limitAsUsd = `$${(accountLimits.intraLedgerLimit / 100).toFixed(2)}`
    const limitErrMsg = `Cannot transfer more than ${limitAsUsd} in 24 hours`

    return volumeRemaining.amount >= amount.amount
      ? true
      : new IntraledgerLimitsExceededError(limitErrMsg)
  }

  const checkWithdrawal = async ({
    amount,
    volumeRemaining,
  }: {
    amount: UsdPaymentAmount
    volumeRemaining: UsdPaymentAmount
  }) => {
    const limitAsUsd = `$${(accountLimits.withdrawalLimit / 100).toFixed(2)}`
    const limitErrMsg = `Cannot transfer more than ${limitAsUsd} in 24 hours`

    return volumeRemaining.amount >= amount.amount
      ? true
      : new WithdrawalLimitsExceededError(limitErrMsg)
  }

  const checkTradeIntraAccount = async ({
    amount,
    volumeRemaining,
  }: {
    amount: UsdPaymentAmount
    volumeRemaining: UsdPaymentAmount
  }) => {
    const limitAsUsd = `$${(accountLimits.tradeIntraAccountLimit / 100).toFixed(2)}`
    const limitErrMsg = `Cannot transfer more than ${limitAsUsd} in 24 hours`

    return volumeRemaining.amount >= amount.amount
      ? true
      : new TradeIntraAccountLimitsExceededError(limitErrMsg)
  }

  return {
    checkIntraledger,
    checkWithdrawal,
    checkTradeIntraAccount,
  }
}
