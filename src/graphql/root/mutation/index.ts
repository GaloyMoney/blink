import { ExchangeCurrencyUnit, WalletCurrency } from "@domain/shared"

export const normalizePaymentAmount = (
  paymentAmount: PaymentAmount<WalletCurrency>,
): PaymentAmountPayload<ExchangeCurrencyUnit> => ({
  amount: Number(paymentAmount.amount),
  currencyUnit:
    paymentAmount.currency === WalletCurrency.Usd
      ? ExchangeCurrencyUnit.Usd
      : ExchangeCurrencyUnit.Btc,
})
