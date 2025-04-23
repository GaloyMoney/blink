import { InvalidPhoneNumber } from "@/domain/errors"
import { checkedToPhoneNumber } from "@/domain/users"

describe("phonenumber-check", () => {
  it("Fail just prefix", () => {
    const phone = checkedToPhoneNumber("+1")
    expect(phone).toBeInstanceOf(InvalidPhoneNumber)
  })

  it("Fail bitcoin address", () => {
    const phone = checkedToPhoneNumber("1LKvxGL8ejTsgBjRVUNCGi7adiwaVnM9cn")
    expect(phone).toBeInstanceOf(InvalidPhoneNumber)
  })

  it("Fail incompleted phone number", () => {
    const phone = checkedToPhoneNumber("+1650")
    expect(phone).toBeInstanceOf(InvalidPhoneNumber)
  })

  it("Fail with non digits", () => {
    const phone = checkedToPhoneNumber("+1650555abcd")
    expect(phone).toBeInstanceOf(InvalidPhoneNumber)
  })

  it("Success with valid phone number without + prefix", () => {
    let phone = checkedToPhoneNumber("16505554321")
    expect(phone).toEqual("+16505554321")
    phone = checkedToPhoneNumber("1 650-555-4321")
    expect(phone).toEqual("+16505554321")
    phone = checkedToPhoneNumber("1 (650) 555-4321")
    expect(phone).toEqual("+16505554321")
  })

  it("Success on good phone number with + prefix", () => {
    let phone = checkedToPhoneNumber("+16505554321")
    expect(phone).toEqual("+16505554321")
    phone = checkedToPhoneNumber("+1 650-555-4321")
    expect(phone).toEqual("+16505554321")
    phone = checkedToPhoneNumber("+1 (650) 555-4321")
    expect(phone).toEqual("+16505554321")
  })

  it("Handles null, undefined or empty strings", () => {
    const phone1 = checkedToPhoneNumber("")
    expect(phone1).toBeInstanceOf(InvalidPhoneNumber)

    const phone2 = checkedToPhoneNumber(null as unknown as string)
    expect(phone2).toBeInstanceOf(InvalidPhoneNumber)

    const phone3 = checkedToPhoneNumber(undefined as unknown as string)
    expect(phone3).toBeInstanceOf(InvalidPhoneNumber)
  })

  it("Fails with double + prefix", () => {
    const phone = checkedToPhoneNumber("++16505554321")
    expect(phone).toBeInstanceOf(InvalidPhoneNumber)
  })

  it("Fails for short phone numbers", () => {
    const phone = checkedToPhoneNumber("+321313123")
    expect(phone).toBeInstanceOf(InvalidPhoneNumber)
  })

  it("Handles phone numbers with whitespace", () => {
    let phone = checkedToPhoneNumber(" +16505554321 ")
    expect(phone).toEqual("+16505554321")

    phone = checkedToPhoneNumber("  16505554321  ")
    expect(phone).toEqual("+16505554321")
  })

  it("Accepts the special exception phone number +1928282918", () => {
    // This phone number would normally be invalid (only 9 digits after country code)
    // but we've added a special exception for it
    const phone = checkedToPhoneNumber("+1928282918")
    expect(phone).toEqual("+1928282918")

    // Also test with spaces and without + prefix
    const phoneWithSpaces = checkedToPhoneNumber(" +1 928 282 918 ")
    expect(phoneWithSpaces).toEqual("+1 928 282 918")

    const phoneWithoutPlus = checkedToPhoneNumber("1928282918")
    expect(phoneWithoutPlus).toEqual("+1928282918")
  })
})
