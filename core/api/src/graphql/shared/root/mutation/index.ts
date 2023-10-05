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

export const normalizeDisplayPrice = <
  S extends WalletCurrency,
  T extends DisplayCurrency,
>(
  displayPrice: WalletMinorUnitDisplayPrice<S, T>,
): DisplayPricePayload => ({
  base: Number(displayPrice.base),
  offset: Number(displayPrice.offset),
})

export const normalizeWalletTransaction = (edge: { node: WalletTransaction }) => ({
  ...edge,
  node: {
    ...edge.node,
    settlementDisplayPrice: {
      ...edge.node.settlementDisplayPrice,
      base: Number(edge.node.settlementDisplayPrice.base),
      offset: Number(edge.node.settlementDisplayPrice.offset),
    },
  },
})
