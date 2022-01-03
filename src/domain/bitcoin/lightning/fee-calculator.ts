import { FEECAP_PERCENT, FEEMIN } from "@domain/bitcoin"

import { toSats } from ".."

export const LnFeeCalculator = (
  {
    feeCapPercent,
    feeMin,
  }: {
    feeCapPercent
    feeMin: Satoshis
  } = {
    feeCapPercent: FEECAP_PERCENT,
    feeMin: FEEMIN,
  },
): LnFeeCalculator => ({
  max: (amount: Satoshis): Satoshis =>
    toSats(Math.floor(Math.max(feeCapPercent * amount, feeMin))),
})
