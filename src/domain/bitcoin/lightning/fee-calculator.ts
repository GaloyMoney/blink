import { FEECAP_PERCENT, FEEMIN } from "@domain/bitcoin"

import { toSats } from ".."

export const LnFeeCalculator = (
  {
    feeCapPercent,
    feeMin,
  }: {
    feeCapPercent: FeeCapPercent
    feeMin: Satoshis
  } = {
    feeCapPercent: FEECAP_PERCENT,
    feeMin: FEEMIN,
  },
): LnFeeCalculator => ({
  max: (amount: Satoshis): Satoshis => {
    const variable = Math.floor(feeCapPercent * Number(amount))
    const fixed = Number(feeMin)
    return toSats(BigInt(Math.max(variable, fixed)))
  },
})
