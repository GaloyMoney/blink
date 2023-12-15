import {
  MAX_CENTS,
  MAX_SATS,
  WalletCurrency,
  BtcAmountTooLargeError,
  UsdAmountTooLargeError,
  checkedToBtcPaymentAmount,
  checkedToUsdPaymentAmount,
  InvalidBtcPaymentAmountError,
  InvalidUsdPaymentAmountError,
} from "@/domain/shared"

describe("checkedToBtcPaymentAmount", () => {
  it("errors on null", () => {
    expect(checkedToBtcPaymentAmount(null)).toBeInstanceOf(InvalidBtcPaymentAmountError)
  })

  it("errors on amount greater than max value", () => {
    expect(checkedToBtcPaymentAmount(Number(MAX_SATS.amount + 1n))).toBeInstanceOf(
      BtcAmountTooLargeError,
    )
    expect(checkedToBtcPaymentAmount(Number(MAX_SATS.amount))).toStrictEqual(MAX_SATS)
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

  it("errors on amount greater than max value", () => {
    expect(checkedToUsdPaymentAmount(Number(MAX_CENTS.amount + 1n))).toBeInstanceOf(
      UsdAmountTooLargeError,
    )
    expect(checkedToUsdPaymentAmount(Number(MAX_CENTS.amount))).toStrictEqual(MAX_CENTS)
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
