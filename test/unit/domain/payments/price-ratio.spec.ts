import { WalletCurrency } from "@domain/shared"
import { InvalidZeroAmountPriceRatioInputError, PriceRatio } from "@domain/payments"

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
    if (priceRatio instanceof Error) throw priceRatio

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
    if (priceRatio instanceof Error) throw priceRatio

    expect(priceRatio.convertFromBtc(convertAmount)).toEqual({
      amount: 4n,
      currency: WalletCurrency.Usd,
    })
  })

  it("rounds amounts", () => {
    const priceRatioRoundDown = PriceRatio({
      usd: {
        amount: 4_100_000n,
        currency: WalletCurrency.Usd,
      },
      btc: {
        amount: 100_000_000n,
        currency: WalletCurrency.Btc,
      },
    })
    if (priceRatioRoundDown instanceof Error) throw priceRatioRoundDown

    expect(
      priceRatioRoundDown.convertFromUsd({ amount: 1n, currency: WalletCurrency.Usd }),
    ).toEqual({
      amount: 24n,
      currency: WalletCurrency.Btc,
    })

    const priceRatioRoundUp = PriceRatio({
      usd: {
        amount: 3_900_000n,
        currency: WalletCurrency.Usd,
      },
      btc: {
        amount: 100_000_000n,
        currency: WalletCurrency.Btc,
      },
    })
    if (priceRatioRoundUp instanceof Error) throw priceRatioRoundUp

    expect(
      priceRatioRoundUp.convertFromUsd({ amount: 1n, currency: WalletCurrency.Usd }),
    ).toEqual({
      amount: 26n,
      currency: WalletCurrency.Btc,
    })

    const priceRatioRoundSameHigher = PriceRatio({
      usd: {
        amount: 4_000_100n,
        currency: WalletCurrency.Usd,
      },
      btc: {
        amount: 100_000_000n,
        currency: WalletCurrency.Btc,
      },
    })
    if (priceRatioRoundSameHigher instanceof Error) throw priceRatioRoundSameHigher

    expect(
      priceRatioRoundSameHigher.convertFromUsd({
        amount: 1n,
        currency: WalletCurrency.Usd,
      }),
    ).toEqual({
      amount: 25n,
      currency: WalletCurrency.Btc,
    })

    const priceRatioRoundSameLower = PriceRatio({
      usd: {
        amount: 3_999_900n,
        currency: WalletCurrency.Usd,
      },
      btc: {
        amount: 100_000_000n,
        currency: WalletCurrency.Btc,
      },
    })
    if (priceRatioRoundSameLower instanceof Error) throw priceRatioRoundSameLower

    expect(
      priceRatioRoundSameLower.convertFromUsd({
        amount: 1n,
        currency: WalletCurrency.Usd,
      }),
    ).toEqual({
      amount: 25n,
      currency: WalletCurrency.Btc,
    })
  })

  it("does not return zero usd amount for small ratios", () => {
    const convertAmount = {
      amount: 40n,
      currency: WalletCurrency.Btc,
    }

    const priceRatio = PriceRatio({
      usd: { amount: 1n, currency: WalletCurrency.Usd },
      btc: { amount: 1000n, currency: WalletCurrency.Btc },
    })
    if (priceRatio instanceof Error) throw priceRatio

    expect(priceRatio.convertFromBtc(convertAmount)).toEqual({
      amount: 1n,
      currency: WalletCurrency.Usd,
    })
  })

  it("does not return zero btc amount for small ratios", () => {
    const convertAmount = {
      amount: 40n,
      currency: WalletCurrency.Usd,
    }

    const priceRatio = PriceRatio({
      usd: { amount: 1000n, currency: WalletCurrency.Usd },
      btc: { amount: 1n, currency: WalletCurrency.Btc },
    })
    if (priceRatio instanceof Error) throw priceRatio

    expect(priceRatio.convertFromUsd(convertAmount)).toEqual({
      amount: 1n,
      currency: WalletCurrency.Btc,
    })
  })

  it("returns error for zero amount btc", () => {
    const priceRatio = PriceRatio({
      usd: {
        amount: 1n,
        currency: WalletCurrency.Usd,
      },
      btc: {
        amount: 0n,
        currency: WalletCurrency.Btc,
      },
    })
    expect(priceRatio).toBeInstanceOf(InvalidZeroAmountPriceRatioInputError)
  })

  it("returns error for zero amount usd", () => {
    const priceRatio = PriceRatio({
      usd: {
        amount: 0n,
        currency: WalletCurrency.Usd,
      },
      btc: {
        amount: 1n,
        currency: WalletCurrency.Btc,
      },
    })
    expect(priceRatio).toBeInstanceOf(InvalidZeroAmountPriceRatioInputError)
  })
})
