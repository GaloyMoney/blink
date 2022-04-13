import { toSats } from "@domain/bitcoin"
import { FeeDifferenceError } from "@domain/ledger"
import { FeeReimbursement, NewFeeReimbursement } from "@domain/ledger/fee-reimbursement"
import { WalletCurrency } from "@domain/shared"

describe("FeeReimbursement", () => {
  it("returns a fee difference for reimbursement", () => {
    const prepaidFee = toSats(100)
    const feeReimbursement = FeeReimbursement(prepaidFee)
    const actualFee = toSats(20)
    const feeDifference = feeReimbursement.getReimbursement(actualFee)
    expect(feeDifference).toEqual(80)
  })
  it("returns FeeDifferenceError zero prepaid fee", () => {
    const prepaidFee = toSats(0)
    const feeReimbursement = FeeReimbursement(prepaidFee)
    const actualFee = toSats(20)
    const feeDifference = feeReimbursement.getReimbursement(actualFee)
    expect(feeDifference).toBeInstanceOf(FeeDifferenceError)
  })
  it("returns FeeDifferenceError if actual fee is greater than prepaid fee", () => {
    const prepaidFee = toSats(100)
    const feeReimbursement = FeeReimbursement(prepaidFee)
    const actualFee = toSats(300)
    const feeDifference = feeReimbursement.getReimbursement(actualFee)
    expect(feeDifference).toBeInstanceOf(FeeDifferenceError)
  })
})

describe("NewFeeReimbursement", () => {
  it("returns a fee difference for reimbursement", () => {
    const prepaidFeeAmount = {
      btc: { amount: 100n, currency: WalletCurrency.Btc },
      usd: { amount: 5n, currency: WalletCurrency.Usd },
    }
    const feeReimbursement = NewFeeReimbursement(prepaidFeeAmount)
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
    const feeReimbursement = NewFeeReimbursement(prepaidFeeAmount)
    const actualFeeAmount = { amount: 20n, currency: WalletCurrency.Btc }
    const feeDifference = feeReimbursement.getReimbursement(actualFeeAmount)
    expect(feeDifference).toBeInstanceOf(FeeDifferenceError)
  })
  it("returns FeeDifferenceError if actual fee is greater than prepaid fee", () => {
    const prepaidFeeAmount = {
      btc: { amount: 100n, currency: WalletCurrency.Btc },
      usd: { amount: 5n, currency: WalletCurrency.Usd },
    }
    const feeReimbursement = NewFeeReimbursement(prepaidFeeAmount)
    const actualFeeAmount = { amount: 300n, currency: WalletCurrency.Btc }
    const feeDifference = feeReimbursement.getReimbursement(actualFeeAmount)
    expect(feeDifference).toBeInstanceOf(FeeDifferenceError)
  })
})
