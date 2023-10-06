import { FeeDifferenceError } from "@/domain/ledger"
import { FeeReimbursement } from "@/domain/ledger/fee-reimbursement"
import { WalletPriceRatio } from "@/domain/payments"
import { WalletCurrency } from "@/domain/shared"

describe("FeeReimbursement", () => {
  it("returns a fee difference for reimbursement", () => {
    const prepaidFeeAmount = {
      btc: { amount: 100n, currency: WalletCurrency.Btc },
      usd: { amount: 5n, currency: WalletCurrency.Usd },
    }

    const priceRatio = WalletPriceRatio(prepaidFeeAmount)
    if (priceRatio instanceof Error) throw priceRatio

    const feeReimbursement = FeeReimbursement({ prepaidFeeAmount, priceRatio })
    const actualFeeAmount = { amount: 20n, currency: WalletCurrency.Btc }
    const feeDifferenceAmount = feeReimbursement.getReimbursement(actualFeeAmount)

    const expectedFeeDifferenceAmount = {
      btc: { amount: 80n, currency: WalletCurrency.Btc },
      usd: { amount: 4n, currency: WalletCurrency.Usd },
    }
    expect(feeDifferenceAmount).toStrictEqual(expectedFeeDifferenceAmount)
  })
  it("returns FeeDifferenceError zero prepaid fee", () => {
    const prepaidFeeAmount = {
      btc: { amount: 0n, currency: WalletCurrency.Btc },
      usd: { amount: 0n, currency: WalletCurrency.Usd },
    }

    const priceRatio = WalletPriceRatio({
      btc: { amount: 80n, currency: WalletCurrency.Btc },
      usd: { amount: 4n, currency: WalletCurrency.Usd },
    })
    if (priceRatio instanceof Error) throw priceRatio

    const feeReimbursement = FeeReimbursement({ prepaidFeeAmount, priceRatio })
    const actualFeeAmount = { amount: 20n, currency: WalletCurrency.Btc }
    const feeDifference = feeReimbursement.getReimbursement(actualFeeAmount)
    expect(feeDifference).toBeInstanceOf(FeeDifferenceError)
  })
  it("returns FeeDifferenceError if actual fee is greater than prepaid fee", () => {
    const prepaidFeeAmount = {
      btc: { amount: 100n, currency: WalletCurrency.Btc },
      usd: { amount: 5n, currency: WalletCurrency.Usd },
    }

    const priceRatio = WalletPriceRatio(prepaidFeeAmount)
    if (priceRatio instanceof Error) throw priceRatio

    const feeReimbursement = FeeReimbursement({ prepaidFeeAmount, priceRatio })
    const actualFeeAmount = { amount: 300n, currency: WalletCurrency.Btc }
    const feeDifference = feeReimbursement.getReimbursement(actualFeeAmount)
    expect(feeDifference).toBeInstanceOf(FeeDifferenceError)
  })

  describe("returns rounded down amount for USD amounts", () => {
    describe("ratio from fees, max fee rounds exactly", () => {
      const prepaidFeeAmount = {
        btc: { amount: 100n, currency: WalletCurrency.Btc },
        usd: { amount: 5n, currency: WalletCurrency.Usd },
      }

      const priceRatio = WalletPriceRatio(prepaidFeeAmount)
      if (priceRatio instanceof Error) throw priceRatio

      const feeReimbursement = FeeReimbursement({ prepaidFeeAmount, priceRatio })

      it("max fee rounds exactly", async () => {
        const { usd, btc } = prepaidFeeAmount
        expect(priceRatio.usdPerSat()).toEqual(0.05)
        expect((usd.amount * btc.amount) % usd.amount).toEqual(0n)
      })

      it("rounds down to 'max fee - 1' if reimbursement normally rounds up to max fee", () => {
        // Calculate fee reimbursement
        const actualFeeAmount = { amount: 1n, currency: WalletCurrency.Btc }
        const feeDifference = feeReimbursement.getReimbursement(actualFeeAmount)
        expect(feeDifference).not.toBeInstanceOf(Error)
        if (feeDifference instanceof Error) throw feeDifference

        // Test: fee reimbursement
        expect(feeDifference).toStrictEqual({
          btc: { amount: 99n, currency: "BTC" },
          usd: { currency: "USD", amount: 4n },
        })
        expect(feeDifference.usd.amount).toEqual(prepaidFeeAmount.usd.amount - 1n)

        // Test: normal fee rounding for scenario
        const roundedUsdFeeReimbursement = priceRatio.convertFromBtc(feeDifference.btc)
        expect(roundedUsdFeeReimbursement.amount).toEqual(prepaidFeeAmount.usd.amount)
      })

      it("rounds down to 'max fee - 1' if fee normally rounds down to 'max fee - 1'", () => {
        // Calculate fee reimbursement
        const actualFeeAmount = { amount: 19n, currency: WalletCurrency.Btc }
        const feeDifference = feeReimbursement.getReimbursement(actualFeeAmount)
        expect(feeDifference).not.toBeInstanceOf(Error)
        if (feeDifference instanceof Error) throw feeDifference

        // Test: fee reimbursement
        expect(feeDifference).toStrictEqual({
          btc: { amount: 81n, currency: "BTC" },
          usd: { currency: "USD", amount: 4n },
        })
        expect(feeDifference.usd.amount).toEqual(prepaidFeeAmount.usd.amount - 1n)

        // Test: normal fee rounding for scenario
        const roundedUsdFeeReimbursement = priceRatio.convertFromBtc(feeDifference.btc)
        expect(roundedUsdFeeReimbursement.amount).toEqual(
          prepaidFeeAmount.usd.amount - 1n,
        )
      })

      it("rounds down to 'max fee - 2' if fee normally rounds up to 'max fee - 1'", () => {
        // Calculate fee reimbursement
        const actualFeeAmount = { amount: 21n, currency: WalletCurrency.Btc }
        const feeDifference = feeReimbursement.getReimbursement(actualFeeAmount)
        expect(feeDifference).not.toBeInstanceOf(Error)
        if (feeDifference instanceof Error) throw feeDifference

        // Test: fee reimbursement
        expect(feeDifference).toStrictEqual({
          btc: { amount: 79n, currency: "BTC" },
          usd: { currency: "USD", amount: 3n },
        })
        expect(feeDifference.usd.amount).toEqual(prepaidFeeAmount.usd.amount - 2n)

        // Test: normal fee rounding for scenario
        const roundedUsdFeeReimbursement = priceRatio.convertFromBtc(feeDifference.btc)
        expect(roundedUsdFeeReimbursement.amount).toEqual(
          prepaidFeeAmount.usd.amount - 1n,
        )
      })
    })

    describe("ratio from payment amounts, max fee rounds down normally", () => {
      const paymentAmounts = {
        btc: { amount: 4000n, currency: WalletCurrency.Btc },
        usd: { amount: 120n, currency: WalletCurrency.Usd },
      }

      const priceRatio = WalletPriceRatio(paymentAmounts)
      if (priceRatio instanceof Error) throw priceRatio

      const paymentFlowConvertFromBtc = priceRatio.convertFromBtcToCeil

      it("rounds down if fee normally rounds down to 'max fee - 1'", () => {
        // Construct max fees paid
        const satsFee = { amount: 80n, currency: WalletCurrency.Btc }
        const centsFee = paymentFlowConvertFromBtc(satsFee)
        expect(centsFee).toStrictEqual({ amount: 3n, currency: WalletCurrency.Usd })
        const prepaidFeeAmount = { btc: satsFee, usd: centsFee }

        // Test: max usd fee has a remainder and rounds down to 'max fee - 1' normally
        const { usd, btc } = paymentAmounts
        expect((satsFee.amount * usd.amount) % btc.amount).not.toEqual(0n)
        const centsFeeWithNormalRounding = priceRatio.convertFromBtc(satsFee)
        expect(centsFeeWithNormalRounding.amount).toEqual(centsFee.amount - 1n)

        // Calculate fee reimbursement
        const feeReimbursement = FeeReimbursement({ prepaidFeeAmount, priceRatio })
        const actualFeeAmount = { amount: 5n, currency: WalletCurrency.Btc }
        const feeDifference = feeReimbursement.getReimbursement(actualFeeAmount)
        expect(feeDifference).not.toBeInstanceOf(Error)
        if (feeDifference instanceof Error) throw feeDifference

        // Test: fee reimbursement
        expect(feeDifference).toStrictEqual({
          btc: { amount: 75n, currency: WalletCurrency.Btc },
          usd: { amount: 2n, currency: WalletCurrency.Usd },
        })
        expect(feeDifference.usd.amount).toEqual(centsFee.amount - 1n)
      })
    })

    describe("ratio from payment amounts, max fee rounds up normally", () => {
      const paymentAmounts = {
        btc: { amount: 5000n, currency: WalletCurrency.Btc },
        usd: { amount: 150n, currency: WalletCurrency.Usd },
      }

      const priceRatio = WalletPriceRatio(paymentAmounts)
      if (priceRatio instanceof Error) throw priceRatio

      const paymentFlowConvertFromBtc = priceRatio.convertFromBtcToCeil

      it("rounds down to 'max fee - 1' if fee normally rounds up to max fee", () => {
        // Construct max fees paid
        const satsFee = { amount: 90n, currency: WalletCurrency.Btc }
        const centsFee = paymentFlowConvertFromBtc(satsFee)
        expect(centsFee).toStrictEqual({ amount: 3n, currency: WalletCurrency.Usd })
        const prepaidFeeAmount = { btc: satsFee, usd: centsFee }

        // Test: max usd fee has a remainder and rounds up to max fee normally
        const { usd, btc } = paymentAmounts
        expect((satsFee.amount * usd.amount) % btc.amount).not.toEqual(0n)
        const centsFeeWithNormalRounding = priceRatio.convertFromBtc(satsFee)
        expect(centsFeeWithNormalRounding.amount).toEqual(centsFee.amount)

        // Calculate fee reimbursement
        const feeReimbursement = FeeReimbursement({ prepaidFeeAmount, priceRatio })
        const actualFeeAmount = { amount: 5n, currency: WalletCurrency.Btc }
        const feeDifference = feeReimbursement.getReimbursement(actualFeeAmount)
        expect(feeDifference).not.toBeInstanceOf(Error)
        if (feeDifference instanceof Error) throw feeDifference

        // Test: fee reimbursement
        expect(feeDifference).toStrictEqual({
          btc: { amount: 85n, currency: WalletCurrency.Btc },
          usd: { amount: 2n, currency: WalletCurrency.Usd },
        })
        expect(feeDifference.usd.amount).toEqual(centsFee.amount - 1n)
      })
    })
  })

  it("returns exact amount for USD amounts when no remainder", () => {
    const prepaidFeeAmount = {
      btc: { amount: 100n, currency: WalletCurrency.Btc },
      usd: { amount: 5n, currency: WalletCurrency.Usd },
    }

    const priceRatio = WalletPriceRatio(prepaidFeeAmount)
    if (priceRatio instanceof Error) throw priceRatio

    const feeReimbursement = FeeReimbursement({ prepaidFeeAmount, priceRatio })

    const actualFeeAmount = { amount: 20n, currency: WalletCurrency.Btc }
    const feeDifference = feeReimbursement.getReimbursement(actualFeeAmount)
    expect(feeDifference).toStrictEqual({
      btc: { amount: 80n, currency: "BTC" },
      usd: { currency: "USD", amount: 4n },
    })
  })
  it("returns original amount for zero fee actual amount, ratio rounds exactly", () => {
    const prepaidFeeAmount = {
      btc: { amount: 100n, currency: WalletCurrency.Btc },
      usd: { amount: 5n, currency: WalletCurrency.Usd },
    }

    const priceRatio = WalletPriceRatio(prepaidFeeAmount)
    if (priceRatio instanceof Error) throw priceRatio

    const feeReimbursement = FeeReimbursement({ prepaidFeeAmount, priceRatio })
    const actualFeeAmount = { amount: 0n, currency: WalletCurrency.Btc }
    const feeDifference = feeReimbursement.getReimbursement(actualFeeAmount)

    expect(feeDifference).toStrictEqual(prepaidFeeAmount)
  })
  it("returns original amount for zero fee actual amount, ratio rounds with remainder", () => {
    const paymentAmounts = {
      btc: { amount: 2004n, currency: WalletCurrency.Btc },
      usd: { amount: 100n, currency: WalletCurrency.Usd },
    }

    const priceRatio = WalletPriceRatio(paymentAmounts)
    if (priceRatio instanceof Error) throw priceRatio

    const btc = { amount: 40n, currency: WalletCurrency.Btc }
    const usd = priceRatio.convertFromBtc(btc)
    const prepaidFeeAmount = { btc, usd }
    expect(btc.amount % paymentAmounts.btc.amount).not.toEqual(0n)

    const feeReimbursement = FeeReimbursement({ prepaidFeeAmount, priceRatio })
    const actualFeeAmount = { amount: 0n, currency: WalletCurrency.Btc }
    const feeDifference = feeReimbursement.getReimbursement(actualFeeAmount)

    expect(feeDifference).toStrictEqual(prepaidFeeAmount)
  })
})
