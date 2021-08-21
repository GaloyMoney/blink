import { GT } from "@graphql/index"
import AccountLevel from "../scalar/account-level"
import AccountStatus from "../scalar/account-status"
import Wallet from "./wallet"

const Account = new GT.Interface({
  name: "Account",
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
    // TODO: limits, csvTransactions
  }),
})

export default Account
