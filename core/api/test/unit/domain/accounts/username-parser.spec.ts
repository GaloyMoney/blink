import { UsernameParser } from "@/domain/accounts"
import { InvalidUsername } from "@/domain/errors"

describe("UsernameParser", () => {
  describe("isUsd", () => {
    it("parses a '+usd' flag", () => {
      const parser = UsernameParser("user+usd" as UsernameWithFlags)
      expect(parser.parsedUsername()).toEqual("user")
      expect(parser.isUsd()).toBeTruthy()
    })

    it("parses a non-'+usd' flag", () => {
      const parser = UsernameParser("user" as UsernameWithFlags)
      expect(parser.parsedUsername()).toEqual("user")
      expect(parser.isUsd()).toBeFalsy()
    })

    it("errors for a short username with '+usd' flag", () => {
      const parser = UsernameParser("bo+usd" as UsernameWithFlags)
      expect(parser.parsedUsername()).toBeInstanceOf(InvalidUsername)
      expect(parser.isUsd()).toBeInstanceOf(InvalidUsername)
    })
  })
})
