import { WalletCurrency } from "@domain/shared"
import {
  InvalidZeroAmountPriceRatioInputError,
  PriceRatio,
  toPriceRatio,
} from "@domain/payments"

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

  describe("rounds amounts", () => {
    const btcPivot = { amount: 100_000_000n, currency: WalletCurrency.Btc }
    const quotient = 25n

    it("correctly rounds down when unrounded value is just below 0.5 less than target quotient", () => {
      const priceRatio = PriceRatio({
        usd: {
          amount: 4_100_000n,
          currency: WalletCurrency.Usd,
        },
        btc: btcPivot,
      })
      if (priceRatio instanceof Error) throw priceRatio

      expect(
        priceRatio.convertFromUsd({ amount: 1n, currency: WalletCurrency.Usd }),
      ).toEqual({
        amount: quotient - 1n,
        currency: WalletCurrency.Btc,
      })
    })

    it("correctly rounds up when unrounded value is just above 0.5 more than target quotient", () => {
      const priceRatio = PriceRatio({
        usd: {
          amount: 3_900_000n,
          currency: WalletCurrency.Usd,
        },
        btc: btcPivot,
      })
      if (priceRatio instanceof Error) throw priceRatio

      expect(
        priceRatio.convertFromUsd({ amount: 1n, currency: WalletCurrency.Usd }),
      ).toEqual({
        amount: quotient + 1n,
        currency: WalletCurrency.Btc,
      })
    })

    it("correctly rounds down when unrounded value is just above target quotient", () => {
      const priceRatio = PriceRatio({
        usd: {
          amount: 3_999_900n,
          currency: WalletCurrency.Usd,
        },
        btc: btcPivot,
      })
      if (priceRatio instanceof Error) throw priceRatio

      expect(
        priceRatio.convertFromUsd({
          amount: 1n,
          currency: WalletCurrency.Usd,
        }),
      ).toEqual({
        amount: quotient,
        currency: WalletCurrency.Btc,
      })
    })

    it("correctly rounds up when unrounded value is just below target quotient", () => {
      const priceRatio = PriceRatio({
        usd: {
          amount: 4_000_100n,
          currency: WalletCurrency.Usd,
        },
        btc: btcPivot,
      })
      if (priceRatio instanceof Error) throw priceRatio

      expect(
        priceRatio.convertFromUsd({
          amount: 1n,
          currency: WalletCurrency.Usd,
        }),
      ).toEqual({
        amount: 25n,
        currency: WalletCurrency.Btc,
      })
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

  it("returns zero usd amount for zero btc conversion input", () => {
    const convertAmount = {
      amount: 0n,
      currency: WalletCurrency.Btc,
    }

    const priceRatio = PriceRatio({
      usd: { amount: 1000n, currency: WalletCurrency.Usd },
      btc: { amount: 1n, currency: WalletCurrency.Btc },
    })
    if (priceRatio instanceof Error) throw priceRatio

    expect(priceRatio.convertFromBtc(convertAmount)).toEqual({
      amount: 0n,
      currency: WalletCurrency.Usd,
    })
  })

  it("returns zero btc amount for zero usd conversion input", () => {
    const convertAmount = {
      amount: 0n,
      currency: WalletCurrency.Usd,
    }

    const priceRatio = PriceRatio({
      usd: { amount: 1000n, currency: WalletCurrency.Usd },
      btc: { amount: 1n, currency: WalletCurrency.Btc },
    })
    if (priceRatio instanceof Error) throw priceRatio

    expect(priceRatio.convertFromUsd(convertAmount)).toEqual({
      amount: 0n,
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

describe("to PriceRatio from float ratio", () => {
  it("converts a float ratio to PriceRatio object", async () => {
    const ratio = 0.0005

    const priceRatio = toPriceRatio(ratio)
    expect(priceRatio).not.toBeInstanceOf(Error)
    if (priceRatio instanceof Error) throw priceRatio

    expect(priceRatio.usdPerSat()).toEqual(ratio)
  })
})
