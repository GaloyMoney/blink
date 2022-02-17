import {
  IntraledgerLimitsExceededError,
  TwoFALimitsExceededError,
  WithdrawalLimitsExceededError,
} from "@domain/errors"
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
    const remainingTwoFALimit = limit - walletVolume.outgoingBaseAmount
    addAttributesToCurrentSpan({
      "txVolume.threshold": limit.toString(),
      "txVolume.amountInBase": amount.toString(),
      "txVolume.limitCheck": "checkTwoFA",
    })

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
    const remainingLimit = limit - walletVolume.outgoingBaseAmount
    addAttributesToCurrentSpan({
      "txVolume.threshold": limit.toString(),
      "txVolume.amountInBase": amount.toString(),
      "txVolume.limitCheck": "checkIntraledger",
    })

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
    const remainingLimit = limit - walletVolume.outgoingBaseAmount
    addAttributesToCurrentSpan({
      "txVolume.threshold": limit.toString(),
      "txVolume.amountInBase": amount.toString(),
      "txVolume.limitCheck": "checkWithdrawal",
    })
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
