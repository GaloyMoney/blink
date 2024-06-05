import { amountCalculator } from "@/lib/amount-calculator"
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
  const exchangeRate = amountCalculator.voucherAmountAfterCommission({
    voucherPrice: 1 / usdToCurrencyRate,
    commissionPercentage: Number(commissionPercentage),
  })

  return exchangeRate
}
