import { toSats } from "@domain/bitcoin"
import { toCents } from "@domain/fiat"
import {
  IntraledgerLimitsExceededError,
  TwoFALimitsExceededError,
  WithdrawalLimitsExceededError,
} from "@domain/errors"
import {
  paymentAmountFromCents,
  paymentAmountFromSats,
  WalletCurrency,
} from "@domain/shared"
import { addAttributesToCurrentSpan } from "@services/tracing"

const convertVolume = async ({
  walletVolume,
  walletCurrency,
  usdFromBtcMidPriceFn,
}): Promise<UsdPaymentAmount | DealerPriceServiceError> => {
  const volumeAmountInWalletCurrency =
    walletCurrency === WalletCurrency.Btc
      ? paymentAmountFromSats(toSats(walletVolume.outgoingBaseAmount))
      : paymentAmountFromCents(toCents(walletVolume.outgoingBaseAmount))

  return volumeAmountInWalletCurrency.currency === WalletCurrency.Btc
    ? usdFromBtcMidPriceFn(volumeAmountInWalletCurrency)
    : volumeAmountInWalletCurrency
}

export const AccountLimitsChecker = ({
  accountLimits,
  usdFromBtcMidPriceFn,
}: {
  accountLimits: IAccountLimits
  usdFromBtcMidPriceFn
}): AccountLimitsChecker => {
  const checkIntraledger = async ({
    amount,
    walletVolume,
    walletCurrency,
  }: NewLimiterCheckInputs): Promise<true | LimitsExceededError> => {
    const volumeInUsdAmount = await convertVolume({
      walletCurrency,
      walletVolume,
      usdFromBtcMidPriceFn,
    })
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
    walletCurrency,
  }: NewLimiterCheckInputs): Promise<true | LimitsExceededError> => {
    const volumeInUsdAmount = await convertVolume({
      walletCurrency,
      walletVolume,
      usdFromBtcMidPriceFn,
    })
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
  usdFromBtcMidPriceFn
}): TwoFALimitsChecker => {
  const checkTwoFA = async ({
    amount,
    walletVolume,
    walletCurrency,
  }: NewLimiterCheckInputs): Promise<true | LimitsExceededError> => {
    const volumeInUsdAmount = await convertVolume({
      walletCurrency,
      walletVolume,
      usdFromBtcMidPriceFn,
    })
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
