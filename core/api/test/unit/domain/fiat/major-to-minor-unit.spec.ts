import { majorToMinorUnit } from "@/domain/fiat"

describe("majorToMinorUnit", () => {
  it("should handle float correctly", () => {
    let amount = 68.85
    let displayCurrency = "USD" as DisplayCurrency
    let result = majorToMinorUnit({ amount, displayCurrency })
    expect(result).toBe(6885)

    amount = 0.000638418984375
    result = majorToMinorUnit({ amount, displayCurrency })
    expect(result).toBe(0.0638418984375)

    amount = 68.85
    displayCurrency = "JPY" as DisplayCurrency
    result = majorToMinorUnit({ amount, displayCurrency })
    expect(result).toBe(68.85)

    amount = 0.000638418984375
    result = majorToMinorUnit({ amount, displayCurrency })
    expect(result).toBe(0.000638418984375)
  })

  it("should handle bigint correctly", () => {
    const amount = BigInt(10)
    let displayCurrency = "USD" as DisplayCurrency
    let result = majorToMinorUnit({ amount, displayCurrency })
    expect(result).toBe(1000)

    displayCurrency = "JPY" as DisplayCurrency
    result = majorToMinorUnit({ amount, displayCurrency })
    expect(result).toBe(10)
  })
})
