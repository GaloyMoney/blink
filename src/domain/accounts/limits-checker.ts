import { getUserLimits } from "@config/app"
import { LimitsExceededError } from "@domain/errors"
import { SettlementMethod } from "../wallets"

export const LimitsChecker = ({
  accountLevel,
}: {
  accountLevel: AccountLevel
}): LimitsChecker => {
  const check = ({
    walletVolume,
    pendingAmount,
    settlementMethod,
  }: {
    walletVolume: TxVolume
    pendingAmount: Satoshis
    settlementMethod: SettlementMethod
  }): void | LimitsExceededError => {
    const userLimits = getUserLimits({ level: accountLevel })

    const limit =
      settlementMethod == SettlementMethod.IntraLedger
        ? userLimits.onUsLimit
        : userLimits.withdrawalLimit
    const remainingLimit = limit - walletVolume.outgoingSats
    if (remainingLimit < pendingAmount) {
      return new LimitsExceededError(
        `Cannot transfer more than ${limit} sats in 24 hours`,
      )
    }
  }

  return {
    check,
  }
}
