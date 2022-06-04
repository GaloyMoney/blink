import { FEECAP_PERCENT } from "@domain/bitcoin"

export const LnFeeCalculator = (
  {
    feeCapPercent,
  }: // feeMin,
  {
    feeCapPercent: number
    // feeMin: Satoshis
  } = {
    feeCapPercent: FEECAP_PERCENT,
    // feeMin: FEEMIN,
  },
): LnFeeCalculator => ({
  // FIXME: missing toSats or toCents validation
  max: <T extends UsdCents | Satoshis>(amount: T) =>
    Math.floor(feeCapPercent * amount) as T,

  inverseMax: <T extends UsdCents | Satoshis>(amount: T) =>
    Math.floor(amount / feeCapPercent) as T,

  // FIXME: temporarily removing the feeMin to make the max function compatible with UsdCents
  // toSats(Math.floor(Math.max(feeCapPercent * amount, feeMin))),
  // max: (amount: Satoshis): Satoshis =>
  //   toSats(Math.floor(Math.max(feeCapPercent * amount, feeMin))),
})
