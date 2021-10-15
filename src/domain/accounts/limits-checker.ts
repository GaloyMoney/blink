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
  const checkTwoFA = ({ amount }: { amount: Satoshis }): true | LimitsExceededError => {
    const remainingTwoFALimit = twoFALimits.threshold - walletVolume.outgoingSats
    if (remainingTwoFALimit < amount) {
      return new TwoFALimitsExceededError("Need a 2FA code to proceed with the payment")
    }
    return true
  }

  const checkIntraledger = ({
    amount,
  }: {
    amount: Satoshis
  }): true | LimitsExceededError => {
    const remainingLimit = userLimits.onUsLimit - walletVolume.outgoingSats // should be walletVolumeOnUs
    if (remainingLimit < amount) {
      return new LimitsExceededError(
        `Cannot transfer more than ${userLimits.onUsLimit} sats in 24 hours`,
      )
    }
    return true
  }

  const checkWithdrawal = ({
    amount,
  }: {
    amount: Satoshis
  }): true | LimitsExceededError => {
    const remainingLimit = userLimits.withdrawalLimit - walletVolume.outgoingSats // should be walletVolumeWithdrawal
    if (remainingLimit < amount) {
      return new LimitsExceededError(
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
