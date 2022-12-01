import { AccountLimitsRange as DomainAccountLimitsRange } from "@domain/accounts"

import { GT } from "@graphql/index"

const values = {} as Record<AccountLimitsRange, { value: AccountLimitsRange }>
for (const rawKey of Object.keys(DomainAccountLimitsRange)) {
  const key = rawKey as AccountLimitsRange
  values[key] = { value: DomainAccountLimitsRange[key] }
}

const AccountLimitsRange = GT.Enum({
  name: "AccountLimitsRange",
  description: "The period to apply for a given limit check based on transaction volume",
  values,
})

export default AccountLimitsRange
