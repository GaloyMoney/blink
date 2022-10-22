import {
  IntraledgerLimitsExceededError,
  WithdrawalLimitsExceededError,
} from "@domain/errors"
import { addAttributesToCurrentSpan } from "@services/tracing"

export const LimitsChecker = ({
  accountLimits,
}: {
  accountLimits: IAccountLimits
}): LimitsChecker => {
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
    checkIntraledger,
    checkWithdrawal,
  }
}
