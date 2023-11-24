import { isDisposablePhoneNumber } from "@/services/twilio-service"

describe("Twilio Service", () => {
  describe("isDisposablePhoneNumber", () => {
    const amounts = [
      { phone: "+34689682259", expected: true },
      { phone: "34689682259", expected: true },
      { phone: "+34699682259", expected: false },
      { phone: "34699682259", expected: false },
    ]
    test.each(amounts)("phone $phone is disposable: $expected", ({ phone, expected }) => {
      const result = isDisposablePhoneNumber(phone as PhoneNumber)
      expect(result).toEqual(expected)
    })
  })
})
