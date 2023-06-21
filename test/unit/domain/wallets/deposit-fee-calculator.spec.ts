import { DepositFeeCalculator } from "@domain/wallets"
import { WalletCurrency, ZERO_SATS } from "@domain/shared"

describe("DepositFeeCalculator", () => {
  const calculator = DepositFeeCalculator()
  const amount = {
    amount: 100n,
    currency: WalletCurrency.Btc,
  }

  describe("onChainDepositFee", () => {
    it("applies a depositFeeRatio", () => {
      const ratio = 200n as DepositFeeRatioAsBasisPoints
      const fee = calculator.onChainDepositFee({ amount, ratio })
      expect(fee).toEqual({ amount: 2n, currency: WalletCurrency.Btc })
    })

    it("applies a depositFeeRatio of 0", () => {
      const ratio = 0n as DepositFeeRatioAsBasisPoints
      const fee = calculator.onChainDepositFee({ amount, ratio })
      expect(fee).toEqual(ZERO_SATS)
    })
  })

  describe("lnDepositFee", () => {
    it("is free", () => {
      const fee = calculator.lnDepositFee()
      expect(fee).toEqual(ZERO_SATS)
    })
  })
})
