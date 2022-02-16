import {
  IntraledgerLimitsExceededError,
  TwoFALimitsExceededError,
  WithdrawalLimitsExceededError,
} from "@domain/errors"

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
    const remainingTwoFALimit = twoFALimits.threshold - walletVolume.outgoingBaseAmount
    if (remainingTwoFALimit < amount) {
      return new TwoFALimitsExceededError()
    }
    return true
  }

  const checkIntraledger = ({
    amount,
    walletVolume,
  }: LimiterCheckInputs): true | LimitsExceededError => {
    const remainingLimit =
      accountLimits.intraLedgerLimit - walletVolume.outgoingBaseAmount
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
    const remainingLimit = accountLimits.withdrawalLimit - walletVolume.outgoingBaseAmount
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
