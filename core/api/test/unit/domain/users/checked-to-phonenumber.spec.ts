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
})
