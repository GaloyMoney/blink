import { DisplayAmountsConverter, UsdDisplayCurrency } from "@/domain/fiat"

import { WalletCurrency, ZERO_CENTS, ZERO_SATS } from "@/domain/shared"
import { DisplayPriceRatio } from "@/domain/payments"

describe("DisplayAmountsConverter", () => {
  const amounts: AmountsAndFees = {
    btcPaymentAmount: { amount: 50_000n, currency: WalletCurrency.Btc },
    btcProtocolAndBankFee: { amount: 1_000n, currency: WalletCurrency.Btc },
    usdPaymentAmount: { amount: 1_250n, currency: WalletCurrency.Usd },
    usdProtocolAndBankFee: { amount: 25n, currency: WalletCurrency.Usd },
  }

  const amountsAndZeroFees: AmountsAndFees = {
    ...amounts,
    btcProtocolAndBankFee: ZERO_SATS,
    usdProtocolAndBankFee: ZERO_CENTS,
  }

  const btcQuoteAmount = {
    amount: 5000n,
    currency: WalletCurrency.Btc,
  }

  const displayQuoteAmount = {
    amountInMinor: 100n,
    displayInMajor: "1.00" as DisplayCurrencyMajorAmount,
  }

  const expectedResultForCurrency = (currency: DisplayCurrency) => {
    // Based on ratio of `amounts` to `btcQuoteAmount`
    const expectedResult = {
      displayAmount: {
        amountInMinor: 1000n,
        currency: undefined,
        displayInMajor: "10.00",
      },
      displayFee: { amountInMinor: 20n, currency: undefined, displayInMajor: "0.20" },
      displayCurrency: undefined,
      displayPrice: {
        base: 20000000000n,
        offset: 12n,
        displayCurrency: undefined,
        walletCurrency: "BTC",
      },
    }

    return {
      displayAmount: { ...expectedResult.displayAmount, currency },
      displayFee: { ...expectedResult.displayFee, currency },
      displayCurrency: currency,
      displayPrice: { ...expectedResult.displayPrice, displayCurrency: currency },
    }
  }

  const expectedResultForUsd = () => {
    const expectedResult = expectedResultForCurrency(UsdDisplayCurrency)
    return {
      ...expectedResult,
      displayAmount: {
        ...expectedResult.displayAmount,
        amountInMinor: 1250n,
        displayInMajor: "12.50",
      },
      displayFee: {
        ...expectedResult.displayFee,
        amountInMinor: 25n,
        displayInMajor: "0.25",
      },
    }
  }

  describe("non-usd display currency", () => {
    const currency = "EUR" as DisplayCurrency

    const displayEurPriceRatio = DisplayPriceRatio({
      displayAmount: { ...displayQuoteAmount, currency },
      walletAmount: btcQuoteAmount,
    })
    if (displayEurPriceRatio instanceof Error) throw displayEurPriceRatio

    const expectedEurResult = expectedResultForCurrency(currency)

    it("converts amounts to EUR", async () => {
      const res = DisplayAmountsConverter(displayEurPriceRatio).convert(amounts)
      expect(res).toStrictEqual(expectedEurResult)
    })

    it("converts amounts with zero fees to EUR", async () => {
      const expectedZeroFeeEurResult = {
        ...expectedEurResult,
        displayFee: {
          ...expectedEurResult.displayFee,
          amountInMinor: 0n,
          displayInMajor: "0.00",
        },
      }

      const res =
        DisplayAmountsConverter(displayEurPriceRatio).convert(amountsAndZeroFees)
      expect(res).toStrictEqual(expectedZeroFeeEurResult)
    })
  })

  describe("usd display currency", () => {
    const currency = UsdDisplayCurrency

    const displayUsdPriceRatio = DisplayPriceRatio({
      displayAmount: { ...displayQuoteAmount, currency },
      walletAmount: btcQuoteAmount,
    })
    if (displayUsdPriceRatio instanceof Error) throw displayUsdPriceRatio

    const expectedUsdResultFromDisplay = expectedResultForCurrency(currency)
    const expectedUsdResultFromWallet = expectedResultForUsd()

    it("converts amounts to USD", async () => {
      const res = DisplayAmountsConverter(displayUsdPriceRatio).convert(amounts)
      expect(res).not.toStrictEqual(expectedUsdResultFromDisplay)
      expect(res).toStrictEqual(expectedUsdResultFromWallet)
    })

    it("converts amounts with zero fees to USD", async () => {
      const expectedZeroFeeUsdResult = {
        ...expectedUsdResultFromWallet,
        displayFee: {
          ...expectedUsdResultFromWallet.displayFee,
          amountInMinor: 0n,
          displayInMajor: "0.00",
        },
      }

      const res =
        DisplayAmountsConverter(displayUsdPriceRatio).convert(amountsAndZeroFees)
      expect(res).toStrictEqual(expectedZeroFeeUsdResult)
    })
  })
})
