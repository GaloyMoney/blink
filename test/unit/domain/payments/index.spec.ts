import {
  checkedToBtcPaymentAmount,
  checkedToUsdPaymentAmount,
  InvalidBtcPaymentAmountError,
  InvalidUsdPaymentAmountError,
} from "@domain/payments"
import { WalletCurrency } from "@domain/shared"

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
