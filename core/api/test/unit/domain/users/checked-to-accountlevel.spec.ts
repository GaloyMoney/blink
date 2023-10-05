import { checkedToAccountLevel } from "@/domain/accounts"
import { InvalidAccountLevelError } from "@/domain/errors"

describe("account-level-check", () => {
  it("Passes with valid account levels", () => {
    expect(checkedToAccountLevel(1)).toEqual(1)
    expect(checkedToAccountLevel(2)).toEqual(2)
  })

  it("Fails with invalid account level", () => {
    expect(checkedToAccountLevel(3)).toBeInstanceOf(InvalidAccountLevelError)
  })
})
