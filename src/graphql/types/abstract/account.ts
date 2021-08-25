import { GT } from "@graphql/index"
// import Limits from "../object/limits"
// import AccountLevel from "../scalar/account-level"
// import AccountStatus from "../scalar/account-status"
import Wallet from "./wallet"

const IAccount = new GT.Interface({
  name: "Account",
  fields: () => ({
    // level: {
    //   type: GT.NonNull(AccountLevel),
    // },
    // status: {
    //   type: GT.NonNull(AccountStatus),
    // },
    // canWithdraw: {
    //   type: GT.NonNull(GT.Boolean),
    // },
    // limits: {
    //   type: GT.NonNull(Limits),
    // },
    wallets: {
      type: GT.NonNullList(Wallet),
    },
    csvTransactions: {
      type: GT.NonNull(GT.String),
      args: {
        walletIds: {
          type: GT.NonNullList(GT.ID),
        },
      },
    },

    // FUTURE-PLAN: Support a `users: [User!]!` field here
  }),
})

export default IAccount
