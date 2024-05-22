export function formatCurrency({
  amount,
  currency,
}: {
  amount: number
  currency: string
}) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount)
}

export const validateCommission = (value: string): number => {
  const parsedValue = Number(parseFloat(value).toFixed(2))
  console.log("parse", parsedValue)
  if (isNaN(parsedValue) || parsedValue < 0) {
    return 0
  }
  if (parsedValue > 99) {
    return 99
  }
  return parsedValue
}
