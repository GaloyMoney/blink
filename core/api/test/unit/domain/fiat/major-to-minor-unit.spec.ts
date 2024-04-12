import { majorToMinorUnit } from "@/domain/fiat"

describe("majorToMinorUnit", () => {
  it("should handle float correctly", () => {
    const amount = 68.85
    let displayCurrency = "USD" as DisplayCurrency
    let result = majorToMinorUnit({ amount, displayCurrency })
    expect(result).toBe(6885)

    displayCurrency = "JPY" as DisplayCurrency
    result = majorToMinorUnit({ amount, displayCurrency })
    expect(result).toBe(68.85)
  })

  it("should handle bigint correctly", () => {
    const amount = BigInt(10)
    let displayCurrency = "USD" as DisplayCurrency
    let result = majorToMinorUnit({ amount, displayCurrency })
    expect(result).toBe(1000)

    displayCurrency = "JPY" as DisplayCurrency
    result = majorToMinorUnit({ amount, displayCurrency })
    expect(result).toBe(11)
  })
})
