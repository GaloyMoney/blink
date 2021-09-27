import { FEECAP, FEEMIN } from "@services/lnd/auth"
import { toSats } from ".."

export const LnFeeCalculator = (
  { feeCap = FEECAP, feeMin = FEEMIN } = {
    feeCap: FEECAP,
    feeMin: FEEMIN,
  },
): LnFeeCalculator => {
  return {
    max: (amount: Satoshis): Satoshis =>
      toSats(Math.floor(Math.max(feeCap * amount, feeMin))),
  }
}
