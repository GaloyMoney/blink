import { isTestAccountPhoneAndCode } from "@app/users"
import { getTestAccounts } from "@config/app"

describe("test-accounts", () => {
  const testAccounts = getTestAccounts()

  it("valid user account", () =>
    expect(
      isTestAccountPhoneAndCode({
        code: testAccounts[0].code,
        phone: testAccounts[0].phone,
      }),
    ).toBeTruthy())

  it("mix (invalid) user account", () =>
    expect(
      isTestAccountPhoneAndCode({
        code: testAccounts[1].code,
        phone: testAccounts[0].phone,
      }),
    ).toBeFalsy())

  it("wrong phone", () =>
    expect(
      isTestAccountPhoneAndCode({
        code: testAccounts[1].code,
        phone: "+19999999999" as PhoneNumber,
      }),
    ).toBeFalsy())

  it("empty code", () =>
    expect(
      isTestAccountPhoneAndCode({
        code: "" as PhoneCode,
        phone: "+19999999999" as PhoneNumber,
      }),
    ).toBeFalsy())
})
