import { toSats } from "@domain/bitcoin"
import { FeeDifferenceError } from "@domain/ledger"
import { FeeReimbursement } from "@domain/ledger/fee-reimbursement"

describe("FeeReimbursement", () => {
  it("returns a fee difference for reimbursement", () => {
    const prepaidFee = toSats(100n)
    const feeReimbursement = FeeReimbursement(prepaidFee)
    const actualFee = toSats(20n)
    const feeDifference = feeReimbursement.getReimbursement(actualFee)
    expect(feeDifference).toEqual(80n)
  })
  it("returns FeeDifferenceError zero prepaid fee", () => {
    const prepaidFee = toSats(0n)
    const feeReimbursement = FeeReimbursement(prepaidFee)
    const actualFee = toSats(20n)
    const feeDifference = feeReimbursement.getReimbursement(actualFee)
    expect(feeDifference).toBeInstanceOf(FeeDifferenceError)
  })
  it("returns FeeDifferenceError if actual fee is greater than prepaid fee", () => {
    const prepaidFee = toSats(100n)
    const feeReimbursement = FeeReimbursement(prepaidFee)
    const actualFee = toSats(300n)
    const feeDifference = feeReimbursement.getReimbursement(actualFee)
    expect(feeDifference).toBeInstanceOf(FeeDifferenceError)
  })
})
