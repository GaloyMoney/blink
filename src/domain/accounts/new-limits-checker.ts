import {
  IntraledgerLimitsExceededError,
  TwoFALimitsExceededError,
  WithdrawalLimitsExceededError,
} from "@domain/errors"
import { paymentAmountFromCents, WalletCurrency } from "@domain/shared"
import { addAttributesToCurrentSpan } from "@services/tracing"

export const AccountLimitsChecker = ({
  accountLimits,
  usdFromBtcMidPriceFn,
}: {
  accountLimits: IAccountLimits
  usdFromBtcMidPriceFn: UsdFromBtcMidPriceFn
}): AccountLimitsChecker => {
  const checkIntraledger = async ({
    amount,
    walletVolume,
  }: NewLimiterCheckInputs): Promise<true | LimitsExceededError> => {
    const volumeInUsdAmount =
      walletVolume.outgoingBaseAmount.currency === WalletCurrency.Btc
        ? await usdFromBtcMidPriceFn(walletVolume.outgoingBaseAmount as BtcPaymentAmount)
        : (walletVolume.outgoingBaseAmount as UsdPaymentAmount)
    if (volumeInUsdAmount instanceof Error) return volumeInUsdAmount

    const limit = paymentAmountFromCents(accountLimits.intraLedgerLimit)
    addAttributesToCurrentSpan({
      "txVolume.outgoingInBase": `${volumeInUsdAmount.amount}`,
      "txVolume.threshold": `${limit.amount}`,
      "txVolume.amountInBase": `${amount.amount}`,
      "txVolume.limitCheck": "checkIntraledger",
    })

    const remainingLimit = limit.amount - volumeInUsdAmount.amount
    if (remainingLimit < amount.amount) {
      return new IntraledgerLimitsExceededError(
        `Cannot transfer more than ${accountLimits.intraLedgerLimit} cents in 24 hours`,
      )
    }
    return true
  }

  const checkWithdrawal = async ({
    amount,
    walletVolume,
  }: NewLimiterCheckInputs): Promise<true | LimitsExceededError> => {
    const volumeInUsdAmount =
      walletVolume.outgoingBaseAmount.currency === WalletCurrency.Btc
        ? await usdFromBtcMidPriceFn(walletVolume.outgoingBaseAmount as BtcPaymentAmount)
        : (walletVolume.outgoingBaseAmount as UsdPaymentAmount)
    if (volumeInUsdAmount instanceof Error) return volumeInUsdAmount

    const limit = paymentAmountFromCents(accountLimits.withdrawalLimit)
    addAttributesToCurrentSpan({
      "txVolume.outgoingInBase": `${volumeInUsdAmount.amount}`,
      "txVolume.threshold": `${limit.amount}`,
      "txVolume.amountInBase": `${amount}`,
      "txVolume.limitCheck": "checkWithdrawal",
    })

    const remainingLimit = limit.amount - volumeInUsdAmount.amount
    if (remainingLimit < amount.amount) {
      return new WithdrawalLimitsExceededError(
        `Cannot transfer more than ${accountLimits.withdrawalLimit} cents in 24 hours`,
      )
    }
    return true
  }

  return {
    checkIntraledger,
    checkWithdrawal,
  }
}

export const TwoFALimitsChecker = ({
  twoFALimits,
  usdFromBtcMidPriceFn,
}: {
  twoFALimits: TwoFALimits
  usdFromBtcMidPriceFn: UsdFromBtcMidPriceFn
}): TwoFALimitsChecker => {
  const checkTwoFA = async ({
    amount,
    walletVolume,
  }: NewLimiterCheckInputs): Promise<true | LimitsExceededError> => {
    const volumeInUsdAmount =
      walletVolume.outgoingBaseAmount.currency === WalletCurrency.Btc
        ? await usdFromBtcMidPriceFn(walletVolume.outgoingBaseAmount as BtcPaymentAmount)
        : (walletVolume.outgoingBaseAmount as UsdPaymentAmount)
    if (volumeInUsdAmount instanceof Error) return volumeInUsdAmount

    const limit = paymentAmountFromCents(twoFALimits.threshold)
    addAttributesToCurrentSpan({
      "txVolume.outgoingInBase": `${volumeInUsdAmount.amount}`,
      "txVolume.threshold": `${limit.amount}`,
      "txVolume.amountInBase": `${amount}`,
      "txVolume.limitCheck": "checkTwoFA",
    })

    const remainingLimit = limit.amount - volumeInUsdAmount.amount
    if (remainingLimit < amount.amount) {
      return new TwoFALimitsExceededError()
    }
    return true
  }

  return {
    checkTwoFA,
  }
}
