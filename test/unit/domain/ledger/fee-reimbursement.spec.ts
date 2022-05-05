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
})
