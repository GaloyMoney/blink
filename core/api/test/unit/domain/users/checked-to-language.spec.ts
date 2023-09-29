import { InvalidLanguageError } from "@domain/errors"
import { checkedToLanguage } from "@domain/users"

describe("language-check", () => {
  it("Passes with valid languages", () => {
    expect(checkedToLanguage("")).toEqual("")
    expect(checkedToLanguage("en")).toEqual("en")
    expect(checkedToLanguage("es")).toEqual("es")
  })

  it("Fails with invalid languages", () => {
    expect(checkedToLanguage("Klingon")).toBeInstanceOf(InvalidLanguageError)
  })
})
