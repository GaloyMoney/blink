import { GT } from "@graphql/index"

import IError from "../abstract/error"
import ConsumerAccount from "../object/consumer-account"

const AccountUpdateDefaultWalletIdPayload = GT.Object({
  name: "AccountUpdateDefaultWalletIdPayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    account: {
      type: ConsumerAccount,
    },
  }),
})

export default AccountUpdateDefaultWalletIdPayload
