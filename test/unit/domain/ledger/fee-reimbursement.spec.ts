import { FeeDifferenceError } from "@domain/ledger"
import { FeeReimbursement } from "@domain/ledger/fee-reimbursement"
import { PriceRatio } from "@domain/payments"
import { WalletCurrency } from "@domain/shared"

describe("FeeReimbursement", () => {
  it("returns a fee difference for reimbursement", () => {
    const prepaidFeeAmount = {
      btc: { amount: 100n, currency: WalletCurrency.Btc },
      usd: { amount: 5n, currency: WalletCurrency.Usd },
    }

    const priceRatio = PriceRatio(prepaidFeeAmount)
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

    const priceRatio = PriceRatio({
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

    const priceRatio = PriceRatio(prepaidFeeAmount)
    if (priceRatio instanceof Error) throw priceRatio

    const feeReimbursement = FeeReimbursement({ prepaidFeeAmount, priceRatio })
    const actualFeeAmount = { amount: 300n, currency: WalletCurrency.Btc }
    const feeDifference = feeReimbursement.getReimbursement(actualFeeAmount)
    expect(feeDifference).toBeInstanceOf(FeeDifferenceError)
  })
  it("returns rounded down amount for USD amounts", () => {
    const prepaidFeeAmount = {
      btc: { amount: 100n, currency: WalletCurrency.Btc },
      usd: { amount: 5n, currency: WalletCurrency.Usd },
    }

    const priceRatio = PriceRatio(prepaidFeeAmount)
    if (priceRatio instanceof Error) throw priceRatio

    const feeReimbursement = FeeReimbursement({ prepaidFeeAmount, priceRatio })

    const actualFeeAmount1 = { amount: 1n, currency: WalletCurrency.Btc }
    const feeDifference1 = feeReimbursement.getReimbursement(actualFeeAmount1)
    expect(feeDifference1).toStrictEqual({
      btc: { amount: 99n, currency: "BTC" },
      usd: { currency: "USD", amount: 4n },
    })

    const actualFeeAmount2 = { amount: 19n, currency: WalletCurrency.Btc }
    const feeDifference2 = feeReimbursement.getReimbursement(actualFeeAmount2)
    expect(feeDifference2).toStrictEqual({
      btc: { amount: 81n, currency: "BTC" },
      usd: { currency: "USD", amount: 4n },
    })

    const actualFeeAmount3 = { amount: 21n, currency: WalletCurrency.Btc }
    const feeDifference3 = feeReimbursement.getReimbursement(actualFeeAmount3)
    expect(feeDifference3).toStrictEqual({
      btc: { amount: 79n, currency: "BTC" },
      usd: { currency: "USD", amount: 3n },
    })
  })
  it("returns exact amount for USD amounts when no remainder", () => {
    const prepaidFeeAmount = {
      btc: { amount: 100n, currency: WalletCurrency.Btc },
      usd: { amount: 5n, currency: WalletCurrency.Usd },
    }

    const priceRatio = PriceRatio(prepaidFeeAmount)
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

    const priceRatio = PriceRatio(prepaidFeeAmount)
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

    const priceRatio = PriceRatio(paymentAmounts)
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
