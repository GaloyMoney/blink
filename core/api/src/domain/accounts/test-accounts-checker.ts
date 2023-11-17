export const TestAccountsChecker: TestAccountsChecker = (
  testAccounts: TestAccount[],
) => ({
  isPhoneTest: (phone: PhoneNumber) =>
    testAccounts.findIndex((item) => item.phone === phone) !== -1,
  isPhoneTestAndCodeValid: ({ code, phone }: { code: PhoneCode; phone: PhoneNumber }) =>
    testAccounts.findIndex((item) => item.phone === phone) !== -1 &&
    testAccounts.filter((item) => item.phone === phone)[0].code.toString() ===
      code.toString(),
})
