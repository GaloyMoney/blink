import { getTestAccounts } from "@config/app"
import { isTestAccountPhoneAndCode } from "@domain/users"

describe("test-accounts", () => {
  const testAccounts = getTestAccounts()

  it("valid user account", () =>
    expect(
      isTestAccountPhoneAndCode({
        code: testAccounts[0].code,
        phone: testAccounts[0].phone,
        testAccounts,
      }),
    ).toBeTruthy())

  it("mix (invalid) user account", () =>
    expect(
      isTestAccountPhoneAndCode({
        code: testAccounts[1].code,
        phone: testAccounts[0].phone,
        testAccounts,
      }),
    ).toBeFalsy())

  it("wrong phone", () =>
    expect(
      isTestAccountPhoneAndCode({
        code: testAccounts[1].code,
        phone: "+19999999999" as PhoneNumber,
        testAccounts,
      }),
    ).toBeFalsy())

  it("empty code", () =>
    expect(
      isTestAccountPhoneAndCode({
        code: "" as PhoneCode,
        phone: "+19999999999" as PhoneNumber,
        testAccounts,
      }),
    ).toBeFalsy())
})
