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
    currencyDisplay:"code"
  }).format(amount)
}

export const convertPpmToPercentage = ({ ppm }: { ppm: number }) => {
  return ppm / 10000
}

export const convertCurrency = {
  centsToUsd: ({ cents }: { cents: number }) => {
    return Number((cents / 100).toFixed(2))
  },
  usdToCents: ({ usd }: { usd: number }) => {
    return Number((usd * 100).toFixed(0))
  },
}
