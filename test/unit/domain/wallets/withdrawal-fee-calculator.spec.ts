import { WithdrawalFeeCalculator, WithdrawalFeePriceMethod } from "@domain/wallets"
import { toSats } from "@domain/bitcoin"

const thresholdImbalance = toSats(1_000_000)
const feeRatio = 0.005

const calculator = WithdrawalFeeCalculator({
  thresholdImbalance,
  feeRatio,
})

describe("WithdrawalFeeCalculator", () => {
  describe("onChainWithdrawalFlatFee", () => {
    it("returns the sum of onchain fee and wallet fee", async () => {
      const minerFee = toSats(7200)
      const minBankFee = toSats(2000)
      const imbalanceCalculatorFn = async () => 0 as SwapOutImbalance
      const fee = await calculator.onChainWithdrawalFee({
        method: WithdrawalFeePriceMethod.flat,
        minerFee,
        minBankFee,
        imbalanceCalculatorFn,
      })
      if (fee instanceof Error) throw fee
      expect(fee.totalFee).toEqual(9200)
    })
  })
  describe("onChainWithdrawalProportionalOnImbalanceFee", () => {
    it("returns flat fee for no tx", async () => {
      const minerFee = toSats(7200)
      const minBankFee = toSats(2000)
      const imbalanceCalculatorFn = async () => 0 as SwapOutImbalance
      const fee = await calculator.onChainWithdrawalFee({
        method: WithdrawalFeePriceMethod.proportionalOnImbalance,
        minerFee,
        minBankFee,
        imbalanceCalculatorFn,
      })
      if (fee instanceof Error) throw fee
      expect(fee.totalFee).toEqual(9200)
    })
    it("returns flat fee for loop in imbalance", async () => {
      const minerFee = toSats(7200)
      const minBankFee = toSats(2000)
      const imbalanceCalculatorFn = async () => -2_000_000 as SwapOutImbalance
      const fee = await calculator.onChainWithdrawalFee({
        method: WithdrawalFeePriceMethod.proportionalOnImbalance,
        minerFee,
        minBankFee,
        imbalanceCalculatorFn,
      })
      if (fee instanceof Error) throw fee
      expect(fee.totalFee).toEqual(9200)
    })
    it("returns proportional fee for loop out imbalance above threshold", async () => {
      const minerFee = toSats(7200)
      const minBankFee = toSats(2000)
      const imbalanceCalculatorFn = async () => 2_000_000 as SwapOutImbalance
      const fee = await calculator.onChainWithdrawalFee({
        method: WithdrawalFeePriceMethod.proportionalOnImbalance,
        minerFee,
        minBankFee,
        imbalanceCalculatorFn,
      })
      if (fee instanceof Error) throw fee
      expect(fee.totalFee).toEqual(7200 + 1_000_000 * feeRatio)
    })
  })
  describe("onChainIntraLedgerFee", () => {
    it("always returns zero", async () => {
      const fee = await calculator.onChainIntraLedgerFee()
      expect(fee).toEqual(0)
    })
  })
})
