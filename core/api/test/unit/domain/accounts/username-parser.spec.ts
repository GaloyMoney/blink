import { UsernameParser } from "@/domain/accounts"

describe("UsernameParser", () => {
  describe("isUsd", () => {
    it("parses a '+usd' flag", () => {
      expect(UsernameParser("user+usd" as Username).isUsd()).toBeTruthy()
    })

    it("parses a non-'+usd' flag", () => {
      expect(UsernameParser("user" as Username).isUsd()).toBeFalsy()
    })
  })
})
