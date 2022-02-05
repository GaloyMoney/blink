import { WithdrawalFeeCalculator } from "@domain/wallets"
import { toSats } from "@domain/bitcoin"

const calculator = WithdrawalFeeCalculator()

describe("WithdrawalFeeCalculator", () => {
  describe("onChainWithdrawalFee", () => {
    it("returns the sum of onchain fee and wallet fee", () => {
      const minerFee = toSats(7200n)
      const bankFee = toSats(2000n)
      const fee = calculator.onChainWithdrawalFee({
        minerFee,
        bankFee,
      })
      expect(fee).toEqual(9200n)
    })
  })
  describe("onChainIntraLedgerFee", () => {
    it("always returns zero", () => {
      const fee = calculator.onChainIntraLedgerFee()
      expect(fee).toEqual(0n)
    })
  })
})
