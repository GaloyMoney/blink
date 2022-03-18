import { WithdrawalFeeCalculator } from "@domain/wallets"
import { toSats } from "@domain/bitcoin"

const thresholdImbalance = toSats(1_000_000)

describe("WithdrawalFeeCalculator", () => {
  describe("onChainWithdrawalFlatFee", () => {
    const feeRatio = 0
    const calculator = WithdrawalFeeCalculator({
      thresholdImbalance,
      feeRatio,
    })

    it("returns the sum of onchain fee and wallet fee", async () => {
      const minerFee = toSats(7200)
      const minBankFee = toSats(2000)
      const imbalance = 0 as SwapOutImbalance
      const amount = toSats(100_000_000)
      const fee = calculator.onChainWithdrawalFee({
        minerFee,
        amount,
        minBankFee,
        imbalance,
      })
      expect(fee.totalFee).toEqual(9200)
    })
  })
  describe("onChainWithdrawalProportionalOnImbalanceFee", () => {
    const feeRatio = 0.005
    const calculator = WithdrawalFeeCalculator({
      thresholdImbalance,
      feeRatio,
    })

    it("returns flat fee for no tx", async () => {
      const minerFee = toSats(7200)
      const minBankFee = toSats(2000)
      const imbalance = 0 as SwapOutImbalance
      const amount = toSats(1_000)
      const fee = calculator.onChainWithdrawalFee({
        amount,
        minerFee,
        minBankFee,
        imbalance,
      })
      expect(fee.bankFee).toEqual(minBankFee)
    })
    it("returns flat fee for loop in imbalance and small amount", async () => {
      const minerFee = toSats(7200)
      const minBankFee = toSats(2000)
      const imbalance = -2_000_000 as SwapOutImbalance
      const amount = toSats(1_000_000)
      const fee = calculator.onChainWithdrawalFee({
        amount,
        minerFee,
        minBankFee,
        imbalance,
      })
      expect(fee.bankFee).toEqual(minBankFee)
    })
    it("returns flat fee for loop out imbalance below threshold, low amount", async () => {
      const minerFee = toSats(7200)
      const minBankFee = toSats(2000)
      const imbalance = 500_000 as SwapOutImbalance
      const amount = toSats(250_000)
      const fee = calculator.onChainWithdrawalFee({
        amount,
        minerFee,
        minBankFee,
        imbalance,
      })
      expect(fee.bankFee).toEqual(minBankFee)
    })
    it("returns proportional fee for loop in imbalance and large amount", async () => {
      const minerFee = toSats(7200)
      const minBankFee = toSats(2000)
      const imbalance = -2_000_000 as SwapOutImbalance
      const amount = toSats(100_000_000)
      const fee = calculator.onChainWithdrawalFee({
        amount,
        minerFee,
        minBankFee,
        imbalance,
      })
      expect(fee.bankFee).toEqual((amount + imbalance - thresholdImbalance) * feeRatio)
    })
    it("returns proportional fee for small loop out imbalance and large amount", async () => {
      const minerFee = toSats(7200)
      const minBankFee = toSats(2000)
      const imbalance = 500_000 as SwapOutImbalance
      const amount = toSats(10_000_000)
      const fee = calculator.onChainWithdrawalFee({
        amount,
        minerFee,
        minBankFee,
        imbalance,
      })
      expect(fee.bankFee).toEqual(9_500_000 * feeRatio)
    })
    it("returns flat fee for loop out imbalance below threshold", async () => {
      const minerFee = toSats(7200)
      const minBankFee = toSats(2000)
      const imbalance = 500_000 as SwapOutImbalance
      const amount = toSats(250_000)
      const fee = calculator.onChainWithdrawalFee({
        amount,
        minerFee,
        minBankFee,
        imbalance,
      })
      expect(fee.bankFee).toEqual(minBankFee)
    })

    it("returns proportional fee for loop out imbalance above threshold, amount < imbalance", async () => {
      const minerFee = toSats(7200)
      const minBankFee = toSats(2000)
      const imbalance = 2_000_000 as SwapOutImbalance
      const amount = toSats(500_000)
      const fee = calculator.onChainWithdrawalFee({
        amount,
        minerFee,
        minBankFee,
        imbalance,
      })
      expect(fee.bankFee).toEqual(amount * feeRatio)
    })
    it("returns proportional fee for loop out imbalance above threshold, amount > imbalance", async () => {
      const minerFee = toSats(7200)
      const minBankFee = toSats(2000)
      const imbalance = 2_000_000 as SwapOutImbalance
      const amount = toSats(10_000_000)
      const fee = calculator.onChainWithdrawalFee({
        amount,
        minerFee,
        minBankFee,
        imbalance,
      })
      expect(fee.bankFee).toEqual(amount * feeRatio)
    })
  })
  describe("onChainIntraLedgerFee", () => {
    const feeRatio = 0.005
    const calculator = WithdrawalFeeCalculator({
      thresholdImbalance,
      feeRatio,
    })

    it("always returns zero", async () => {
      const fee = calculator.onChainIntraLedgerFee()
      expect(fee).toEqual(0)
    })
  })
})
