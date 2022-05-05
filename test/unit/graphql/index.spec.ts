import { ExchangeCurrencyUnit, WalletCurrency } from "@domain/shared"
import { normalizePaymentAmount } from "@graphql/root/mutation"

describe("normalizePaymentAmount", () => {
  it("returns the correct type", () => {
    const btcPaymentAmount = {
      amount: 10n,
      currency: WalletCurrency.Btc,
    }
    expect(normalizePaymentAmount(btcPaymentAmount)).toStrictEqual({
      amount: 10,
      currencyUnit: ExchangeCurrencyUnit.Btc,
    })

    const usdPaymentAmount = {
      amount: 20n,
      currency: WalletCurrency.Usd,
    }
    expect(normalizePaymentAmount(usdPaymentAmount)).toStrictEqual({
      amount: 20,
      currencyUnit: ExchangeCurrencyUnit.Usd,
    })
  })
})
