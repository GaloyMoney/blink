import { FEECAP, FEEMIN } from "@services/lnd/auth"
import { toSats } from ".."

export const LnFeeCalculator = (
  { feeCap = FEECAP as Satoshis, feeMin = FEEMIN as Satoshis } = {
    feeCap: FEECAP,
    feeMin: FEEMIN,
  } as {
    feeCap?: Satoshis
    feeMin?: Satoshis
  },
): LnFeeCalculator => {
  return {
    max: (amount: Satoshis): Satoshis =>
      toSats(Math.floor(Math.max(feeCap * amount, feeMin))),
  }
}
