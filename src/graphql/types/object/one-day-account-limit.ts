import { GT } from "@graphql/index"
import { mapError } from "@graphql/error-map"
import IAccountLimit from "@graphql/types/abstract/account-limit"
import CentAmount from "@graphql/types/scalar/cent-amount"
import Seconds from "@graphql/types/scalar/seconds"
import { normalizePaymentAmount } from "@graphql/root/mutation"

import { Accounts } from "@app"
import { AccountLimitsRange, getAccountLimitsFromConfig } from "@domain/accounts"
import { SECS_PER_DAY } from "@config"

const OneDayAccountLimit = GT.Object<{
  account: Account
  limitType: AccountLimitsType
  range: AccountLimitsRange
}>({
  name: "OneDayAccountLimit",
  interfaces: () => [IAccountLimit],
  isTypeOf: ({ range }) => range === AccountLimitsRange.ONE_DAY,

  fields: () => ({
    totalLimit: {
      type: GT.NonNull(CentAmount),
      description: `The current maximum limit for a given 24 hour period.`,
      resolve: async (source) => {
        const { account, limitType } = source
        const limit = await getAccountLimitsFromConfig({
          level: account.level,
          limitType,
        })
        if (limit instanceof Error) throw mapError(limit)

        return limit
      },
    },
    remainingLimit: {
      type: CentAmount,
      description: `The amount of cents remaining below the limit for the current 24 hour period.`,
      resolve: async (source) => {
        const { account, limitType } = source
        const volumes = await Accounts.accountLimit({
          account,
          limitType,
        })
        if (volumes instanceof Error) throw mapError(volumes)

        return normalizePaymentAmount(volumes.volumeRemaining).amount
      },
    },
    interval: {
      type: Seconds,
      description: `The rolling time interval value in seconds for the current 24 hour period.`,
      resolve: () => SECS_PER_DAY,
    },
  }),
})

export default OneDayAccountLimit
