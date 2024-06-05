import { useCurrencyConversionEstimationQuery } from "@/lib/graphql/generated"

export const useCurrencyExchangeRate = ({
  currency,
  commissionPercentage,
}: {
  currency: string
  commissionPercentage: number
}) => {
  const { data: currencyDataForOneUnit } = useCurrencyConversionEstimationQuery({
    variables: { amount: 1000, currency },
    context: { endpoint: "GALOY" },
    fetchPolicy: "no-cache",
  })

  const usdToCurrencyRate =
    currencyDataForOneUnit?.currencyConversionEstimation.usdCentAmount / 1000 / 100.0

  const voucherValueAfterCommission = usdToCurrencyRate * (1 - commissionPercentage / 100)
  return 1 / voucherValueAfterCommission
}
