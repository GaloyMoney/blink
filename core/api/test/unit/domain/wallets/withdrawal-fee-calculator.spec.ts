import { OnChainFees } from "@/domain/wallets"
import { AmountCalculator, WalletCurrency, ZERO_SATS } from "@/domain/shared"

const thresholdImbalance = {
  amount: BigInt(1_000_000),
  currency: WalletCurrency.Btc,
}

const calc = AmountCalculator()

describe("OnChainFees", () => {
  describe("onChainWithdrawalFlatFee", () => {
    const feeRatioAsBasisPoints = 0n
    const calculator = OnChainFees({
      thresholdImbalance,
      feeRatioAsBasisPoints,
    })

    it("returns the sum of onchain fee and wallet fee", async () => {
      const minerFee = { amount: BigInt(7200), currency: WalletCurrency.Btc }
      const minBankFee = { amount: BigInt(2000), currency: WalletCurrency.Btc }
      const imbalance = { amount: BigInt(0), currency: WalletCurrency.Btc }
      const amount = { amount: BigInt(100_000_000), currency: WalletCurrency.Btc }
      const fee = calculator.withdrawalFee({
        minerFee,
        amount,
        minBankFee,
        imbalance,
      })
      expect(fee.totalFee).toEqual({ amount: 9200n, currency: "BTC" })
    })
  })
  describe("onChainWithdrawalProportionalOnImbalanceFee", () => {
    const feeRatioAsBasisPoints = 50n
    const calculator = OnChainFees({
      thresholdImbalance,
      feeRatioAsBasisPoints,
    })

    it("returns flat fee for no tx", async () => {
      const minerFee = { amount: BigInt(7200), currency: WalletCurrency.Btc }
      const minBankFee = { amount: BigInt(2000), currency: WalletCurrency.Btc }
      const imbalance = ZERO_SATS
      const amount = { amount: BigInt(1_000), currency: WalletCurrency.Btc }
      const fee = calculator.withdrawalFee({
        amount,
        minerFee,
        minBankFee,
        imbalance,
      })
      expect(fee.bankFee).toEqual(minBankFee)
    })
    it("returns flat fee for loop in imbalance and small amount", async () => {
      const minerFee = { amount: BigInt(7200), currency: WalletCurrency.Btc }
      const minBankFee = { amount: BigInt(2000), currency: WalletCurrency.Btc }
      const imbalance = { amount: BigInt(-2_000_000), currency: WalletCurrency.Btc }
      const amount = { amount: BigInt(1_000_000), currency: WalletCurrency.Btc }
      const fee = calculator.withdrawalFee({
        amount,
        minerFee,
        minBankFee,
        imbalance,
      })
      expect(fee.bankFee).toEqual(minBankFee)
    })
    it("returns flat fee for loop out imbalance below threshold, low amount", async () => {
      const minerFee = { amount: BigInt(7200), currency: WalletCurrency.Btc }
      const minBankFee = { amount: BigInt(2000), currency: WalletCurrency.Btc }
      const imbalance = { amount: BigInt(500_000), currency: WalletCurrency.Btc }
      const amount = { amount: BigInt(250_000), currency: WalletCurrency.Btc }
      const fee = calculator.withdrawalFee({
        amount,
        minerFee,
        minBankFee,
        imbalance,
      })
      expect(fee.bankFee).toEqual(minBankFee)
    })
    it("returns proportional fee for loop in imbalance and large amount", async () => {
      const minerFee = { amount: BigInt(7200), currency: WalletCurrency.Btc }
      const minBankFee = { amount: BigInt(2000), currency: WalletCurrency.Btc }
      const imbalance = { amount: BigInt(-2_000_000), currency: WalletCurrency.Btc }
      const amount = { amount: BigInt(100_000_000), currency: WalletCurrency.Btc }
      const fee = calculator.withdrawalFee({
        amount,
        minerFee,
        minBankFee,
        imbalance,
      })

      const expectedAmount = calc.mulBasisPoints(
        calc.sub(calc.add(amount, imbalance), thresholdImbalance),
        feeRatioAsBasisPoints,
      )
      expect(fee.bankFee).toEqual(expectedAmount)
    })
    it("returns proportional fee for small loop out imbalance and large amount", async () => {
      const minerFee = { amount: BigInt(7200), currency: WalletCurrency.Btc }
      const minBankFee = { amount: BigInt(2000), currency: WalletCurrency.Btc }
      const imbalance = { amount: BigInt(500_000), currency: WalletCurrency.Btc }
      const amount = { amount: BigInt(10_000_000), currency: WalletCurrency.Btc }
      const fee = calculator.withdrawalFee({
        amount,
        minerFee,
        minBankFee,
        imbalance,
      })
      expect(fee.bankFee).toEqual(
        calc.mulBasisPoints(
          { amount: 9_500_000n, currency: WalletCurrency.Btc },
          feeRatioAsBasisPoints,
        ),
      )
    })
    it("returns flat fee for loop out imbalance below threshold", async () => {
      const minerFee = { amount: BigInt(7200), currency: WalletCurrency.Btc }
      const minBankFee = { amount: BigInt(2000), currency: WalletCurrency.Btc }
      const imbalance = { amount: BigInt(500_000), currency: WalletCurrency.Btc }
      const amount = { amount: BigInt(250_000), currency: WalletCurrency.Btc }
      const fee = calculator.withdrawalFee({
        amount,
        minerFee,
        minBankFee,
        imbalance,
      })
      expect(fee.bankFee).toEqual(minBankFee)
    })

    it("returns proportional fee for loop out imbalance above threshold, amount < imbalance", async () => {
      const minerFee = { amount: BigInt(7200), currency: WalletCurrency.Btc }
      const minBankFee = { amount: BigInt(2000), currency: WalletCurrency.Btc }
      const imbalance = { amount: BigInt(2_000_000), currency: WalletCurrency.Btc }
      const amount = { amount: BigInt(500_000), currency: WalletCurrency.Btc }
      const fee = calculator.withdrawalFee({
        amount,
        minerFee,
        minBankFee,
        imbalance,
      })
      expect(fee.bankFee).toEqual(calc.mulBasisPoints(amount, feeRatioAsBasisPoints))
    })
    it("returns proportional fee for loop out imbalance above threshold, amount > imbalance", async () => {
      const minerFee = { amount: BigInt(7200), currency: WalletCurrency.Btc }
      const minBankFee = { amount: BigInt(2000), currency: WalletCurrency.Btc }
      const imbalance = { amount: BigInt(2_000_000), currency: WalletCurrency.Btc }
      const amount = { amount: BigInt(10_000_000), currency: WalletCurrency.Btc }
      const fee = calculator.withdrawalFee({
        amount,
        minerFee,
        minBankFee,
        imbalance,
      })
      expect(fee.bankFee).toEqual(calc.mulBasisPoints(amount, feeRatioAsBasisPoints))
    })
  })
  describe("onChainIntraLedgerFee", () => {
    const feeRatioAsBasisPoints = 50n
    const calculator = OnChainFees({
      thresholdImbalance,
      feeRatioAsBasisPoints,
    })

    it("always returns zero", async () => {
      const fee = calculator.intraLedgerFees()
      expect(fee.btc.amount).toEqual(0n)
      expect(fee.usd.amount).toEqual(0n)
    })
  })
})
