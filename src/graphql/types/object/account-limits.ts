import { GT } from "@graphql/index"

import AccountLimit from "@graphql/types/abstract/account-limit"

const AccountLimits = GT.Object({
  name: "AccountLimits",
  fields: () => ({
    withdrawal: {
      type: GT.NonNullList(AccountLimit),
      description: `Limits for withdrawing to external onchain or lightning destinations.`,
      resolve: (source: { account: Account; range: AccountLimitsRange }) => {
        const commonProperties = {
          account: source.account,
          limitType: "Withdrawal",
        }

        return [
          {
            ...commonProperties,
            range: source.range,
          },
        ]
      },
    },
    internalSend: {
      type: GT.NonNullList(AccountLimit),
      description: `Limits for sending to other internal accounts.`,
      resolve: (source: { account: Account; range: AccountLimitsRange }) => [
        {
          account: source.account,
          limitType: "Intraledger",
          range: source.range,
        },
      ],
    },
    convert: {
      type: GT.NonNullList(AccountLimit),
      description: `Limits for converting between currencies among a account's own wallets.`,
      resolve: (source: { account: Account; range: AccountLimitsRange }) => [
        {
          account: source.account,
          limitType: "TradeIntraAccount",
          range: source.range,
        },
      ],
    },
  }),
})

export default AccountLimits
