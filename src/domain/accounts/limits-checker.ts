import { toSats } from "@domain/bitcoin"
import {
  IntraledgerLimitsExceededError,
  TwoFALimitsExceededError,
  WithdrawalLimitsExceededError,
} from "@domain/errors"
import { toCents } from "@domain/fiat"
import {
  paymentAmountFromCents,
  paymentAmountFromSats,
  WalletCurrency,
} from "@domain/shared"
import { addAttributesToCurrentSpan } from "@services/tracing"

export const LimitsChecker = ({
  accountLimits,
  twoFALimits,
}: {
  accountLimits: IAccountLimits
  twoFALimits: TwoFALimits
}): LimitsChecker => {
  const checkTwoFA = ({
    amount,
    walletVolume,
  }: LimiterCheckInputs): true | LimitsExceededError => {
    const limit = twoFALimits.threshold
    const volume = walletVolume.outgoingBaseAmount
    addAttributesToCurrentSpan({
      "txVolume.outgoingInBase": `${volume}`,
      "txVolume.threshold": `${limit}`,
      "txVolume.amountInBase": `${amount}`,
      "txVolume.limitCheck": "checkTwoFA",
    })

    const remainingTwoFALimit = limit - volume
    if (remainingTwoFALimit < amount) {
      return new TwoFALimitsExceededError()
    }
    return true
  }

  const checkIntraledger = ({
    amount,
    walletVolume,
  }: LimiterCheckInputs): true | LimitsExceededError => {
    const limit = accountLimits.intraLedgerLimit
    const volume = walletVolume.outgoingBaseAmount
    addAttributesToCurrentSpan({
      "txVolume.outgoingInBase": `${volume}`,
      "txVolume.threshold": `${limit}`,
      "txVolume.amountInBase": `${amount}`,
      "txVolume.limitCheck": "checkIntraledger",
    })

    const remainingLimit = limit - volume
    if (remainingLimit < amount) {
      return new IntraledgerLimitsExceededError(
        `Cannot transfer more than ${accountLimits.intraLedgerLimit} cents in 24 hours`,
      )
    }
    return true
  }

  const checkWithdrawal = ({
    amount,
    walletVolume,
  }: LimiterCheckInputs): true | LimitsExceededError => {
    const limit = accountLimits.withdrawalLimit
    const volume = walletVolume.outgoingBaseAmount
    addAttributesToCurrentSpan({
      "txVolume.outgoingInBase": `${volume}`,
      "txVolume.threshold": `${limit}`,
      "txVolume.amountInBase": `${amount}`,
      "txVolume.limitCheck": "checkWithdrawal",
    })

    const remainingLimit = limit - volume
    if (remainingLimit < amount) {
      return new WithdrawalLimitsExceededError(
        `Cannot transfer more than ${accountLimits.withdrawalLimit} cents in 24 hours`,
      )
    }
    return true
  }

  return {
    checkTwoFA,
    checkIntraledger,
    checkWithdrawal,
  }
}

export const AccountLimitsChecker = ({
  accountLimits,
  usdFromBtcMidPriceFn,
}: {
  accountLimits: IAccountLimits
  usdFromBtcMidPriceFn
}): AccountLimitsChecker => {
  const convertVolume = async ({
    walletVolume,
    walletCurrency,
  }): Promise<UsdPaymentAmount | DealerPriceServiceError> => {
    const volumeAmountInWalletCurrency =
      walletCurrency === WalletCurrency.Btc
        ? paymentAmountFromSats(toSats(walletVolume.outgoingBaseAmount))
        : paymentAmountFromCents(toCents(walletVolume.outgoingBaseAmount))

    return volumeAmountInWalletCurrency.currency === WalletCurrency.Btc
      ? usdFromBtcMidPriceFn(volumeAmountInWalletCurrency)
      : volumeAmountInWalletCurrency
  }

  const checkIntraledger = async ({
    amount,
    walletVolume,
    walletCurrency,
  }: NewLimiterCheckInputs): Promise<true | LimitsExceededError> => {
    const volumeInUsdAmount = await convertVolume({ walletCurrency, walletVolume })
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
    const volumeInUsdAmount = await convertVolume({ walletCurrency, walletVolume })
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
  const convertVolume = async ({
    walletVolume,
    walletCurrency,
  }): Promise<UsdPaymentAmount | DealerPriceServiceError> => {
    const volumeAmountInWalletCurrency =
      walletCurrency === WalletCurrency.Btc
        ? paymentAmountFromSats(toSats(walletVolume.outgoingBaseAmount))
        : paymentAmountFromCents(toCents(walletVolume.outgoingBaseAmount))

    return volumeAmountInWalletCurrency.currency === WalletCurrency.Btc
      ? usdFromBtcMidPriceFn(volumeAmountInWalletCurrency)
      : volumeAmountInWalletCurrency
  }
  const checkTwoFA = async ({
    amount,
    walletVolume,
    walletCurrency,
  }: NewLimiterCheckInputs): Promise<true | LimitsExceededError> => {
    const volumeInUsdAmount = await convertVolume({ walletCurrency, walletVolume })
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
