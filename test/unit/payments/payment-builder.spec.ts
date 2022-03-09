import { PaymentBuilder } from "@domain/payments"
import { ValidationError } from "@domain/shared"

describe("PaymentBuilder", () => {
  describe("ValidationError", () => {
    it("returns the first validation error it encounters", () => {
      const builder = PaymentBuilder()
      expect(builder.withUncheckedAmount(1.1).payment()).toBeInstanceOf(ValidationError)
    })
  })
})
