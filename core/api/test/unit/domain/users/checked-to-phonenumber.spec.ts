import { checkedToPhoneNumber } from "@/domain/users"

describe("phonenumber-check", () => {
  it("Fail just prefix", () => {
    const phone = checkedToPhoneNumber("+1")
    expect(phone).toBeInstanceOf(Error)
  })

  it("Fail bitcoin address", () => {
    const phone = checkedToPhoneNumber("1LKvxGL8ejTsgBjRVUNCGi7adiwaVnM9cn")
    expect(phone).toBeInstanceOf(Error)
  })

  it("Fail incompleted phone number", () => {
    const phone = checkedToPhoneNumber("+1650")
    expect(phone).toBeInstanceOf(Error)
  })

  it("Fail with non digits", () => {
    const phone = checkedToPhoneNumber("+1650555abcd")
    expect(phone).toBeInstanceOf(Error)
  })

  it("a + is needed", () => {
    const phone = checkedToPhoneNumber("6505554321")
    expect(phone).toBeInstanceOf(Error)
  })

  it("Success on good phone number", () => {
    const phone = checkedToPhoneNumber("+16505554321")
    expect(phone).toEqual("+16505554321")
  })
})
