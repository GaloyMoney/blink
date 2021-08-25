import { GT } from "@graphql/index"
import IAccount from "../abstract/account"
import Transaction from "../abstract/transaction"
// import Wallet from "../abstract/wallet"

// import AccountLevel from "../scalar/account-level"
// import AccountStatus from "../scalar/account-status"
// import Limits from "./limits"

const BusinessAccount = new GT.Object({
  name: "BusinessAccount",
  interfaces: () => [IAccount],
  isTypeOf: (source) => source.title || source.coordinate, // TODO: improve
  fields: () => ({
    // level: {
    //   type: GT.NonNull(AccountLevel),
    // },
    // status: {
    //   type: GT.NonNull(AccountStatus),
    // },
    // wallets: {
    //   type: GT.NonNullList(Wallet),
    // },

    // // TODO: confirm
    // canWithdraw: {
    //   type: GT.NonNull(GT.Boolean),
    // },
    // limits: {
    //   type: GT.NonNull(Limits),
    // },

    allTransactions: {
      type: GT.NonNullList(Transaction),
    },

    csvTransactions: {
      type: GT.NonNull(GT.String),
      args: {
        walletIds: {
          type: GT.NonNullList(GT.ID),
        },
      },
    },
  }),
})

export default BusinessAccount
