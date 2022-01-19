import { getWithdrawFeeRange } from "@config/app"
import { checkedToWithdrawFee } from "@domain/accounts"
import { ValidationError } from "@domain/errors"

describe("fee-amount-check", () => {
  const { min, max } = getWithdrawFeeRange()
  it("Value within range passes", () => {
    const fee = (min + max) / 2
    const checkedFee = checkedToWithdrawFee(fee)
    expect(checkedFee).toEqual(fee)
  })

  it("Value less than min fails", () => {
    const fee = min - 1
    const checkedFee = checkedToWithdrawFee(fee)
    expect(checkedFee).toBeInstanceOf(ValidationError)
  })

  it("Value greater than max fails", () => {
    const fee = max + 1
    const checkedFee = checkedToWithdrawFee(fee)
    expect(checkedFee).toBeInstanceOf(ValidationError)
  })
})
