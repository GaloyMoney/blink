import { safeBigInt } from "@domain/shared"

export const CENTS_PER_USD = 100

export const MajorExponent = {
  STANDARD: 2,
  ZERO: 0,
  ONE: 1,
  THREE: 3,
  FOUR: 4,
} as const

export const majorToMinorUnit = ({
  amount,
  displayCurrency,
}: {
  amount: number | bigint
  displayCurrency: DisplayCurrency
}): number => {
  const displayMajorExponent = getCurrencyMajorExponent(displayCurrency)
  return Number(amount) * 10 ** displayMajorExponent
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
      case 4:
        return MajorExponent.FOUR
      default:
        return MajorExponent.STANDARD
    }
  } catch {
    // this is necessary for non-standard currencies
    return MajorExponent.STANDARD
  }
}

export const newDisplayAmountFromNumber = <T extends DisplayCurrency>({
  amount,
  currency,
}: {
  amount: number
  currency: T
}): NewDisplayAmount<T> | ValidationError => {
  const amountInMinor = safeBigInt(amount)
  if (amountInMinor instanceof Error) return amountInMinor

  const displayMajorExponent = getCurrencyMajorExponent(currency)

  return {
    amountInMinor,
    currency,
    displayInMajor: (Number(amountInMinor) / 10 ** displayMajorExponent).toFixed(
      displayMajorExponent,
    ),
  }
}

export const priceAmountFromNumber = <T extends DisplayCurrency>({
  priceOfOneSatInMinorUnit,
  currency,
}: {
  priceOfOneSatInMinorUnit: number
  currency: T
}): PriceAmount<T> => {
  const displayMajorExponent = getCurrencyMajorExponent(currency)

  return {
    priceOfOneSatInMinorUnit,
    priceOfOneSatInMajorUnit: priceOfOneSatInMinorUnit / 10 ** displayMajorExponent,
    currency,
  }
}
