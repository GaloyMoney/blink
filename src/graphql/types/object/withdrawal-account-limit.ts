import { GT } from "@graphql/index"
import { mapError } from "@graphql/error-map"
import IAccountLimit from "@graphql/types/abstract/account-limit"
import CentAmount from "@graphql/types/scalar/cent-amount"
import { normalizePaymentAmount } from "@graphql/root/mutation"

import { Accounts } from "@app"

const WithdrawalAccountLimit = GT.Object<{
  account: Account
  limitType: "Withdrawal" | "Intraledger" | "TradeIntraAccount"
  range: AccountLimitsRange
}>({
  name: "WithdrawalAccountLimit",
  interfaces: () => [IAccountLimit],
  isTypeOf: ({ limitType }) => limitType === "Withdrawal",

  fields: () => ({
    totalLimit: {
      type: GT.NonNull(CentAmount),
      description: `The current maximum withdrawal limit for a given 24 hour period.`,
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
      description: `The amount of cents remaining below the withdrawal limit for the current 24 hour period.`,
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

export default WithdrawalAccountLimit
