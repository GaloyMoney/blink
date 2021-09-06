import { LimitsExceededError, TwoFALimitsExceededError } from "@domain/errors"

export const LimitsChecker = ({
  walletVolume,
  userLimits,
  twoFALimits,
}: {
  walletVolume: TxVolume
  userLimits: IUserLimits
  twoFALimits: TwoFALimits
}): LimitsChecker => {
  const checkTwoFA = ({ amount }: { amount: Satoshis }): void | LimitsExceededError => {
    const remainingTwoFALimit = twoFALimits.threshold - walletVolume.outgoingSats
    if (remainingTwoFALimit < amount) {
      return new TwoFALimitsExceededError("Need a 2FA code to proceed with the payment")
    }
  }

  const checkIntraledger = ({
    amount,
  }: {
    amount: Satoshis
  }): void | LimitsExceededError => {
    const remainingLimit = userLimits.onUsLimit - walletVolume.outgoingSats
    if (remainingLimit < amount) {
      return new LimitsExceededError(
        `Cannot transfer more than ${userLimits.onUsLimit} sats in 24 hours`,
      )
    }
  }

  const checkWithdrawal = ({
    amount,
  }: {
    amount: Satoshis
  }): void | LimitsExceededError => {
    const remainingLimit = userLimits.withdrawalLimit - walletVolume.outgoingSats
    if (remainingLimit < amount) {
      return new LimitsExceededError(
        `Cannot transfer more than ${userLimits.withdrawalLimit} sats in 24 hours`,
      )
    }
  }

  return {
    checkTwoFA,
    checkIntraledger,
    checkWithdrawal,
  }
}
