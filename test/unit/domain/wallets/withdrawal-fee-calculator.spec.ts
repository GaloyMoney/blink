import { WithdrawalFeeCalculator } from "@domain/wallets"
import { toSats } from "@domain/bitcoin"

const calculator = WithdrawalFeeCalculator()

describe("WithdrawalFeeCalculator", () => {
  describe("onChainWithdrawalFee", () => {
    it("returns the sum of onchain fee and wallet fee", () => {
      const onChainFee = toSats(7200)
      const walletFee = toSats(2000)
      const fee = calculator.onChainWithdrawalFee({
        onChainFee,
        walletFee,
      })
      expect(fee).toEqual(9200)
    })
  })
  describe("onChainIntraLedgerFee", () => {
    it("always returns zero", () => {
      const fee = calculator.onChainIntraLedgerFee()
      expect(fee).toEqual(0)
    })
  })
})
