import { AccountLimitsRange, AccountLimitsType } from "@domain/accounts"
import { GT } from "@graphql/index"

import RollingAccountLimit from "@graphql/types/abstract/rolling-account-limit"

const AccountLimitsRolling = GT.Object({
  name: "AccountLimitsRolling",
  fields: () => ({
    withdrawal: {
      type: GT.NonNullList(RollingAccountLimit),
      description: `Limits for withdrawing to external onchain or lightning destinations.`,
      resolve: (source: Account) => {
        const commonProperties = {
          account: source,
          limitType: AccountLimitsType.Withdrawal,
        }

        return Object.values(AccountLimitsRange).map((range) => ({
          ...commonProperties,
          range,
        }))
      },
    },
    internalSend: {
      type: GT.NonNullList(RollingAccountLimit),
      description: `Limits for sending to other internal accounts.`,
      resolve: (source: Account) => {
        const commonProperties = {
          account: source,
          limitType: AccountLimitsType.IntraLedger,
        }

        return Object.values(AccountLimitsRange).map((range) => ({
          ...commonProperties,
          range,
        }))
      },
    },
    convert: {
      type: GT.NonNullList(RollingAccountLimit),
      description: `Limits for converting between currencies among a account's own wallets.`,
      resolve: (source: Account) => {
        const commonProperties = {
          account: source,
          limitType: AccountLimitsType.SelfTrade,
        }

        return Object.values(AccountLimitsRange).map((range) => ({
          ...commonProperties,
          range,
        }))
      },
    },
  }),
})

export default AccountLimitsRolling
