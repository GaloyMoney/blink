import { ExtraLedgerFeeCalculator } from "@domain/wallets"
import { toSats } from "@domain/bitcoin"

describe("ExtraLedgerFeeCalculator", () => {
  describe("onChainDepositFee", () => {
    it("applies a depositFeeRatio", () => {
      const depositedAmount = toSats(100)
      const calculator = ExtraLedgerFeeCalculator(depositedAmount)
      const depositFeeRatio = 0.02 as DepositFeeRatio
      const fee = calculator.onChainDepositFee(depositFeeRatio)
      expect(fee).toEqual(2)
    })
  })
  describe("lnDepositFee", () => {
    it("is free", () => {
      const depositedAmount = toSats(100)
      const calculator = ExtraLedgerFeeCalculator(depositedAmount)
      const fee = calculator.lnDepositFee()
      expect(fee).toEqual(0)
    })
  })
})
