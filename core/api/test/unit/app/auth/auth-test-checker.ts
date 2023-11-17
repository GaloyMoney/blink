import { getTestAccounts } from "@/config"
import { TestAccountsChecker } from "@/domain/accounts/test-accounts-checker"

describe("test-accounts", () => {
  const testAccounts = getTestAccounts()

  it("valid user account", () =>
    expect(
      TestAccountsChecker(testAccounts).isPhoneTestAndCodeValid({
        code: testAccounts[0].code,
        phone: testAccounts[0].phone,
      }),
    ).toBeTruthy())

  it("mix (invalid) user account", () =>
    expect(
      TestAccountsChecker(testAccounts).isPhoneTestAndCodeValid({
        code: testAccounts[1].code,
        phone: testAccounts[0].phone,
      }),
    ).toBeFalsy())

  it("wrong phone", () =>
    expect(
      TestAccountsChecker(testAccounts).isPhoneTestAndCodeValid({
        code: testAccounts[1].code,
        phone: "+19999999999" as PhoneNumber,
      }),
    ).toBeFalsy())

  it("empty code", () =>
    expect(
      TestAccountsChecker(testAccounts).isPhoneTestAndCodeValid({
        code: "" as PhoneCode,
        phone: "+19999999999" as PhoneNumber,
      }),
    ).toBeFalsy())
})
