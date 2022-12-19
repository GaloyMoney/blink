import { GT } from "@graphql/index"

import AccountLimitsRolling from "@graphql/types/object/account-limits-rolling"

const AccountLimitCategories = GT.Object({
  name: "AccountLimitCategories",
  fields: () => ({
    rolling: {
      type: GT.NonNull(AccountLimitsRolling),
      description: `Limits calculated on a rolling basis for the given time interval.`,
      resolve: (source) => source,
    },
    // fixedStart: {
    //   type: GT.NonNull(AccountLimitsFixedStart),
    //   description: `Limits calculated from a fixed start time for a fixed duration for the given time interval.`,
    //   resolve: (source) => source,
    // },
  }),
})

export default AccountLimitCategories
