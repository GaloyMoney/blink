import { GT } from "@graphql/index"
import { mapError } from "@graphql/error-map"
import IAccountLimit from "@graphql/types/abstract/account-limit"
import CentAmount from "@graphql/types/scalar/cent-amount"
import Seconds from "@graphql/types/scalar/seconds"
import { normalizePaymentAmount } from "@graphql/root/mutation"

import { Accounts } from "@app"
import { AccountLimitsRange } from "@domain/accounts"
import { SECS_PER_THIRTY_DAY } from "@config"
import { LimitTimeframe } from "@domain/accounts/limits-volume"

const ThirtyDayAccountLimit = GT.Object<{
  account: Account
  limitType: AccountLimitsType
  range: AccountLimitsRange
}>({
  name: "ThirtyDayAccountLimit",
  interfaces: () => [IAccountLimit],
  isTypeOf: ({ range }) => range === AccountLimitsRange.THIRTY_DAY,

  fields: () => ({
    totalLimit: {
      type: GT.NonNull(CentAmount),
      description: `The current maximum limit for a given 30 days period.`,
      resolve: async (source) => {
        const { account, limitType } = source
        const limit = await Accounts.totalLimit({
          limitTimeframe: LimitTimeframe["30d"],
          level: account.level,
          limitType,
        })
        if (limit instanceof Error) throw mapError(limit)

        return limit
      },
    },
    remainingLimit: {
      type: CentAmount,
      description: `The amount of cents remaining below the limit for the current 30 days period.`,
      resolve: async (source) => {
        const { account, limitType } = source
        const volumeRemaining = await Accounts.remainingLimit({
          limitTimeframe: LimitTimeframe["30d"],
          account,
          limitType,
        })
        if (volumeRemaining instanceof Error) throw mapError(volumeRemaining)

        return normalizePaymentAmount(volumeRemaining).amount
      },
    },
    interval: {
      type: Seconds,
      description: `The rolling time interval value in seconds for the current 30 days period.`,
      resolve: () => SECS_PER_THIRTY_DAY,
    },
  }),
})

export default ThirtyDayAccountLimit
