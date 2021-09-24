import { DepositFeeCalculator } from "@domain/wallets"
import { toSats } from "@domain/bitcoin"

const calculator = DepositFeeCalculator()

describe("DepositFeeCalculator", () => {
  describe("onChainDepositFee", () => {
    it("applies a depositFeeRatio", () => {
      const amount = toSats(100)
      const ratio = 0.02 as DepositFeeRatio
      const fee = calculator.onChainDepositFee({ amount, ratio })
      expect(fee).toEqual(2)
    })
  })
  describe("lnDepositFee", () => {
    it("is free", () => {
      const fee = calculator.lnDepositFee()
      expect(fee).toEqual(0)
    })
  })
})
