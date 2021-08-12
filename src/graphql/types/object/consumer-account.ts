import { GT } from "@graphql/index"
import Account from "../abstract/account"
import Wallet from "../abstract/wallet"

import AccountLevel from "../scalars/account-level"
import AccountStatus from "../scalars/account-status"

const ConsumerAccount = new GT.Object({
  name: "ConsumerAccount",
  interfaces: () => [Account],
  isTypeOf: (source) => !source.title && !source.coordinate, // TODO: improve
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
  }),
})

export default ConsumerAccount
