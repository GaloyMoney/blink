import { getTestAccounts } from "@config/app"
import { TestAccount } from "@domain/users"

describe("test-accounts", () => {
  const testAccounts = getTestAccounts()

  it("valid user account", () =>
    expect(
      TestAccount(testAccounts).isPhoneAndCodeValid({
        code: testAccounts[0].code,
        phone: testAccounts[0].phone,
      }),
    ).toBeTruthy())

  it("mix (invalid) user account", () =>
    expect(
      TestAccount(testAccounts).isPhoneAndCodeValid({
        code: testAccounts[1].code,
        phone: testAccounts[0].phone,
      }),
    ).toBeFalsy())

  it("wrong phone", () =>
    expect(
      TestAccount(testAccounts).isPhoneAndCodeValid({
        code: testAccounts[1].code,
        phone: "+19999999999" as PhoneNumber,
      }),
    ).toBeFalsy())

  it("empty code", () =>
    expect(
      TestAccount(testAccounts).isPhoneAndCodeValid({
        code: "" as PhoneCode,
        phone: "+19999999999" as PhoneNumber,
      }),
    ).toBeFalsy())
})
