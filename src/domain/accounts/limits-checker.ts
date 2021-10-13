import {
  IntraledgerLimitsExceededError,
  TwoFALimitsExceededError,
  WithdrawalLimitsExceededError,
} from "@domain/errors"

export const LimitsChecker = ({
  userLimits,
  twoFALimits,
}: {
  userLimits: IUserLimits
  twoFALimits: TwoFALimits
}): LimitsChecker => {
  const checkTwoFA = ({
    amount,
    walletVolume,
  }: {
    amount: Satoshis
    walletVolume: TxVolume
  }): true | LimitsExceededError => {
    const remainingTwoFALimit = twoFALimits.threshold - walletVolume.outgoingSats
    if (remainingTwoFALimit < amount) {
      return new TwoFALimitsExceededError("Need a 2FA code to proceed with the payment")
    }
    return true
  }

  const checkIntraledger = ({
    amount,
    walletVolume,
  }: {
    amount: Satoshis
    walletVolume: TxVolume
  }): true | LimitsExceededError => {
    const remainingLimit = userLimits.onUsLimit - walletVolume.outgoingSats
    if (remainingLimit < amount) {
      return new IntraledgerLimitsExceededError(
        `Cannot transfer more than ${userLimits.onUsLimit} sats in 24 hours`,
      )
    }
    return true
  }

  const checkWithdrawal = ({
    amount,
    walletVolume,
  }: {
    amount: Satoshis
    walletVolume: TxVolume
  }): true | LimitsExceededError => {
    const remainingLimit = userLimits.withdrawalLimit - walletVolume.outgoingSats
    if (remainingLimit < amount) {
      return new WithdrawalLimitsExceededError(
        `Cannot transfer more than ${userLimits.withdrawalLimit} sats in 24 hours`,
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
