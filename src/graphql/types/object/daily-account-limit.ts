import { GT } from "@graphql/index"
import { mapError } from "@graphql/error-map"
import IAccountLimit from "@graphql/types/abstract/account-limit"
import CentAmount from "@graphql/types/scalar/cent-amount"
import { normalizePaymentAmount } from "@graphql/root/mutation"

import { Accounts } from "@app"
import { AccountLimitsRange } from "@domain/accounts"

const DailyAccountLimit = GT.Object<{
  account: Account
  limitType: "Withdrawal" | "Intraledger" | "TradeIntraAccount"
  range: AccountLimitsRange
}>({
  name: "DailyAccountLimit",
  interfaces: () => [IAccountLimit],
  isTypeOf: ({ range }) => range === AccountLimitsRange.ONE_DAY,

  fields: () => ({
    totalLimit: {
      type: GT.NonNull(CentAmount),
      description: `The current maximum limit for a given 24 hour period.`,
      resolve: async (source) => {
        const { account, limitType } = source
        const limit = await Accounts.getAccountLimitsFromConfig({
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
  }),
})

export default DailyAccountLimit
