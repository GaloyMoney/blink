import { WalletCurrency } from "@domain/shared"
import { PriceRatio } from "@domain/payments"

describe("PriceRatio", () => {
  const usdQuoteAmount = {
    amount: 100n,
    currency: WalletCurrency.Usd,
  }
  const btcQuoteAmount = {
    amount: 1000n,
    currency: WalletCurrency.Btc,
  }

  it("converts usd", () => {
    const convertAmount = {
      amount: 40n,
      currency: WalletCurrency.Usd,
    }

    const priceRatio = PriceRatio({ usd: usdQuoteAmount, btc: btcQuoteAmount })
    expect(priceRatio.convertFromUsd(convertAmount)).toEqual({
      amount: 400n,
      currency: WalletCurrency.Btc,
    })
  })

  it("converts btc", () => {
    const convertAmount = {
      amount: 40n,
      currency: WalletCurrency.Btc,
    }

    const priceRatio = PriceRatio({ usd: usdQuoteAmount, btc: btcQuoteAmount })
    expect(priceRatio.convertFromBtc(convertAmount)).toEqual({
      amount: 4n,
      currency: WalletCurrency.Usd,
    })
  })

  it("rounds amounts", () => {
    const priceRatio = PriceRatio({
      usd: {
        amount: 3_900_300n,
        currency: WalletCurrency.Usd,
      },
      btc: {
        amount: 100_000_000n,
        currency: WalletCurrency.Btc,
      },
    })

    expect(
      priceRatio.convertFromUsd({ amount: 1n, currency: WalletCurrency.Usd }),
    ).toEqual({
      amount: 25n,
      currency: WalletCurrency.Btc,
    })
  })
})
