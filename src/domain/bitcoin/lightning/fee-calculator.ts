import { FEECAP_PERCENT, FEEMIN } from "@domain/bitcoin"
import { toSats } from ".."

export const LnFeeCalculator = (
  { FEECAP_PERCENT = FEECAP_PERCENT, feeMin = FEEMIN } = {
    FEECAP_PERCENT: FEECAP_PERCENT,
    feeMin: FEEMIN,
  },
): LnFeeCalculator => {
  return {
    max: (amount: Satoshis): Satoshis =>
      toSats(Math.floor(Math.max(FEECAP_PERCENT * amount, feeMin))),
  }
}
