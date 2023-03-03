export const CENTS_PER_USD = 100

export const MajorExponent = {
  STANDARD: 2,
  ONE: 1,
  THREE: 3,
} as const

export const minorToMajorUnit = ({
  amount,
  displayMajorExponent,
}: {
  amount: number | bigint
  displayMajorExponent: CurrencyMajorExponent
}) => (Number(amount) / 10 ** displayMajorExponent).toFixed(displayMajorExponent)

export const usdMinorToMajorUnit = (amount: number | bigint) =>
  Number(minorToMajorUnit({ amount, displayMajorExponent: MajorExponent.STANDARD }))

export const majorToMinorUnit = ({
  amount,
  displayMajorExponent,
}: {
  amount: number | bigint
  displayMajorExponent: CurrencyMajorExponent
}) => Number(Number(amount) * 10 ** displayMajorExponent)

export const usdMajorToMinorUnit = (amount: number | bigint) =>
  majorToMinorUnit({ amount, displayMajorExponent: MajorExponent.STANDARD })
