import { GT } from "@graphql/index"

// import IAccountLimit from "@graphql/types/abstract/account-limit"

import WithdrawalAccountLimit from "./withdrawal-account-limit"
import IntraledgerAccountLimit from "./internal-send-account-limit"
import TradeIntraAccountAccountLimit from "./convert-account-limit"

const AccountLimits = GT.Object({
  name: "AccountLimits",
  fields: () => ({
    withdrawal: {
      // TODO: Try to get these to be 'IAccountLimit' with isTypeOf instead
      type: GT.NonNull(WithdrawalAccountLimit),
      description: `Limits for withdrawing to external onchain or lightning destinations.`,
      resolve: (source: { account: Account; range: AccountLimitsRange }) => ({
        account: source.account,
        limitType: "Withdrawal",
        range: source.range,
      }),
    },
    internalSend: {
      type: GT.NonNull(IntraledgerAccountLimit),
      description: `Limits for sending to other internal accounts.`,
      resolve: (source: { account: Account; range: AccountLimitsRange }) => ({
        account: source.account,
        limitType: "Intraledger",
        range: source.range,
      }),
    },
    convert: {
      type: GT.NonNull(TradeIntraAccountAccountLimit),
      description: `Limits for converting between currencies among a account's own wallets.`,
      resolve: (source: { account: Account; range: AccountLimitsRange }) => ({
        account: source.account,
        limitType: "TradeIntraAccount",
        range: source.range,
      }),
    },
  }),
})

export default AccountLimits
