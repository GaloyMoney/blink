export const CENTS_PER_USD = 100

export const MajorExponent = {
  STANDARD: 2n,
  ONE: 1n,
  THREE: 3n,
} as const

export const minorToMajorUnit = ({
  amount,
  displayMajorExponent,
}: {
  amount: number | bigint
  displayMajorExponent: CurrencyMajorExponent
}) => {
  const majorExponent = Number(displayMajorExponent)
  return Number((Number(amount) / 10 ** majorExponent).toFixed(majorExponent))
}

export const usdMinorToMajorUnit = (amount: number | bigint) =>
  minorToMajorUnit({ amount, displayMajorExponent: MajorExponent.STANDARD })

export const majorToMinorUnit = ({
  amount,
  displayMajorExponent,
}: {
  amount: number | bigint
  displayMajorExponent: CurrencyMajorExponent
}) => {
  const majorExponent = Number(displayMajorExponent)
  return Number(Number(amount) * 10 ** majorExponent)
}

export const usdMajorToMinorUnit = (amount: number | bigint) =>
  majorToMinorUnit({ amount, displayMajorExponent: MajorExponent.STANDARD })
