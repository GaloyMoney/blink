import { GT } from "@graphql/index"
import Account from "../abstract/account"
import Transaction from "../abstract/transaction"
import Wallet from "../abstract/wallet"

import AccountLevel from "../scalar/account-level"
import AccountStatus from "../scalar/account-status"

const BusinessAccount = new GT.Object({
  name: "BusinessAccount",
  interfaces: () => [Account],
  isTypeOf: (source) => source.title || source.coordinate, // TODO: improve
  fields: () => ({
    level: {
      type: GT.NonNull(AccountLevel),
    },
    status: {
      type: GT.NonNull(AccountStatus),
    },
    wallets: {
      type: GT.NonNullList(Wallet),
    },

    allTransactions: {
      type: GT.NonNullList(Transaction),
    },

    csvTransactions: {
      type: GT.NonNull(GT.String),
      args: {
        walletIds: {
          type: GT.NonNullList(GT.NonNullID),
        },
      },
    },
  }),
})

export default BusinessAccount
