import {
  checkedToBtcPaymentAmount,
  checkedToUsdPaymentAmount,
  InvalidBtcPaymentAmountError,
  InvalidUsdPaymentAmountError,
  normalizePaymentAmount,
} from "@domain/payments"
import { ExchangeCurrencyUnit, WalletCurrency } from "@domain/shared"

describe("checkedToBtcPaymentAmount", () => {
  it("errors on null", () => {
    expect(checkedToBtcPaymentAmount(null)).toBeInstanceOf(InvalidBtcPaymentAmountError)
  })

  it("ensures integer amount", () => {
    expect(checkedToBtcPaymentAmount(0.4)).toBeInstanceOf(InvalidBtcPaymentAmountError)
  })

  it("returns the correct type", () => {
    expect(checkedToBtcPaymentAmount(1)).toEqual(
      expect.objectContaining({
        currency: WalletCurrency.Btc,
        amount: 1n,
      }),
    )
  })
})

describe("checkedToUsdPaymentAmount", () => {
  it("errors on null", () => {
    expect(checkedToUsdPaymentAmount(null)).toBeInstanceOf(InvalidUsdPaymentAmountError)
  })

  it("ensures integer amount", () => {
    expect(checkedToUsdPaymentAmount(0.4)).toBeInstanceOf(InvalidUsdPaymentAmountError)
  })

  it("returns the correct type", () => {
    expect(checkedToUsdPaymentAmount(1)).toEqual(
      expect.objectContaining({
        currency: WalletCurrency.Usd,
        amount: 1n,
      }),
    )
  })
})

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
