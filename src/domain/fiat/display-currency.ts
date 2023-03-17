export const CENTS_PER_USD = 100

export const MajorExponent = {
  STANDARD: 2,
  ZERO: 0,
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

// TODO: remove after remove hardcoded DisplayCurrency.Usd
export const usdMajorToMinorUnit = (amount: number | bigint) =>
  majorToMinorUnit({ amount, displayMajorExponent: MajorExponent.STANDARD })

export const currencyMajorToMinorUnit = ({
  amount,
  displayCurrency,
}: {
  amount: number | bigint
  displayCurrency: DisplayCurrency
}) => {
  const displayMajorExponent = getCurrencyMajorExponent(displayCurrency)
  return majorToMinorUnit({ amount, displayMajorExponent })
}

export const getCurrencyMajorExponent = (
  currency: DisplayCurrency,
): CurrencyMajorExponent => {
  try {
    const formatter = new Intl.NumberFormat("en-US", { style: "currency", currency })
    const { minimumFractionDigits } = formatter.resolvedOptions()
    switch (minimumFractionDigits) {
      case 0:
        return MajorExponent.ZERO
      case 1:
        return MajorExponent.ONE
      case 3:
        return MajorExponent.THREE
      default:
        return MajorExponent.STANDARD
    }
  } catch {
    return MajorExponent.STANDARD
  }
}
