import { GT } from "@graphql/index"
import { mapAndParseErrorForGqlResponse } from "@graphql/error-map"
import IAccountLimit from "@graphql/types/abstract/account-limit"
import CentAmountPayload from "@graphql/types/payload/cent-amount"
import { normalizePaymentAmount } from "@graphql/root/mutation"

import { Accounts } from "@app"

const IntraLedgerAccountLimit = GT.Object<{
  account: Account
  limitType: "Withdrawal" | "Intraledger" | "TradeIntraAccount"
}>({
  name: "IntraLedgerAccountLimit",
  interfaces: () => [IAccountLimit],
  isTypeOf: ({ limitType }) => limitType === "Intraledger",

  fields: () => ({
    totalLimit: {
      type: GT.NonNull(CentAmountPayload),
      description: `The current maximum internal send limit for a given 24 hour period.`,
      resolve: async (source) => {
        const { account, limitType } = source
        const limit = await Accounts.getAccountLimitsFromConfig({
          level: account.level,
          limitType,
        })
        if (limit instanceof Error) {
          return { errors: [mapAndParseErrorForGqlResponse(limit)] }
        }

        return { amount: limit, errors: [] }
      },
    },
    remainingLimit: {
      type: CentAmountPayload,
      description: `The amount of cents remaining below the internal send limit for the current 24 hour period.`,
      resolve: async (source) => {
        const { account, limitType } = source
        const volumes = await Accounts.accountLimit({
          account,
          limitType,
        })
        if (volumes instanceof Error) {
          return { errors: [mapAndParseErrorForGqlResponse(volumes)] }
        }

        return { ...normalizePaymentAmount(volumes.volumeRemaining), errors: [] }
      },
    },
  }),
})

export default IntraLedgerAccountLimit
