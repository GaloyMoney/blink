import { checkedToChannel, ChannelType } from "@/domain/phone-provider"
import {
  InvalidPhoneNumber,
  InvalidChannel,
  InvalidChannelForCountry,
} from "@/domain/errors"

jest.mock("@/config", () => ({
  ...jest.requireActual("@/config"),
  getSmsAuthUnsupportedCountries: () => ["GB"],
  getWhatsAppAuthUnsupportedCountries: () => ["US"],
}))

describe("checkedToChannel", () => {
  const validUsPhone = "+16505554321"
  const validUkPhone = "+447874482105"

  it("fails with empty phone", () => {
    const result = checkedToChannel("", "sms")
    expect(result).toBeInstanceOf(InvalidPhoneNumber)
  })

  it("fails with empty channel", () => {
    const result = checkedToChannel(validUsPhone, "")
    expect(result).toBeInstanceOf(InvalidChannel)
  })

  it("fails with invalid phone number", () => {
    const result = checkedToChannel("+1", "sms")
    expect(result).toBeInstanceOf(InvalidPhoneNumber)
  })

  it("fails with non-phone-number input", () => {
    const result = checkedToChannel("not-a-phone", "sms")
    expect(result).toBeInstanceOf(InvalidPhoneNumber)
  })

  it("fails with invalid channel type", () => {
    const result = checkedToChannel(validUsPhone, "invalid-channel")
    expect(result).toBeInstanceOf(InvalidChannel)
  })

  describe("SMS channel", () => {
    it("succeeds for supported country", () => {
      const result = checkedToChannel(validUsPhone, "sms")
      expect(result).toBe(ChannelType.Sms)
    })

    it("fails for unsupported country", () => {
      const result = checkedToChannel(validUkPhone, "sms")
      expect(result).toBeInstanceOf(InvalidChannelForCountry)
    })

    it("is case insensitive", () => {
      const result = checkedToChannel(validUsPhone, "SMS")
      expect(result).toBe(ChannelType.Sms)
    })
  })

  describe("WhatsApp channel", () => {
    it("succeeds for supported country", () => {
      const result = checkedToChannel(validUkPhone, "whatsapp")
      expect(result).toBe(ChannelType.Whatsapp)
    })

    it("fails for unsupported country", () => {
      const result = checkedToChannel(validUsPhone, "whatsapp")
      expect(result).toBeInstanceOf(InvalidChannelForCountry)
    })

    it("is case insensitive", () => {
      const result = checkedToChannel(validUkPhone, "WhatsApp")
      expect(result).toBe(ChannelType.Whatsapp)
    })
  })

  describe("edge cases", () => {
    it("handles undefined phone", () => {
      // @ts-expect-error Testing undefined case
      const result = checkedToChannel(undefined, "sms")
      expect(result).toBeInstanceOf(InvalidPhoneNumber)
    })

    it("handles undefined channel", () => {
      // @ts-expect-error Testing undefined case
      const result = checkedToChannel(validUsPhone, undefined)
      expect(result).toBeInstanceOf(InvalidChannel)
    })

    it("handles null phone", () => {
      // @ts-expect-error Testing null case
      const result = checkedToChannel(null, "sms")
      expect(result).toBeInstanceOf(InvalidPhoneNumber)
    })

    it("handles null channel", () => {
      // @ts-expect-error Testing null case
      const result = checkedToChannel(validUsPhone, null)
      expect(result).toBeInstanceOf(InvalidChannel)
    })
  })
})
