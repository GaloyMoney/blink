import { useCurrencyConversionEstimationQuery } from "@/lib/graphql/generated"
import { convertCurrency } from "@/lib/utils"

export const useCurrencyExchangeRate = ({
  currency,
  commissionPercentage,
}: {
  currency: string
  commissionPercentage: number
}) => {
  const { data: currencyDataForOneUnit } = useCurrencyConversionEstimationQuery({
    variables: { amount: 1, currency },
    context: { endpoint: "GALOY" },
    fetchPolicy: "no-cache",
  })
  const usdToCurrencyRate = convertCurrency.centsToUsd({
    cents: currencyDataForOneUnit?.currencyConversionEstimation.usdCentAmount,
  })
  const voucherValueAfterCommission = usdToCurrencyRate * (1 - commissionPercentage / 100)
  return 1 / voucherValueAfterCommission
}
