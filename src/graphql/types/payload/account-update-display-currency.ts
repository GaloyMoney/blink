import { GT } from "@graphql/index"

import IError from "../abstract/error"
import ConsumerAccount from "../object/consumer-account"

const AccountUpdateDisplayCUrrencyPayload = GT.Object({
  name: "AccountUpdateDisplayCUrrencyPayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    account: {
      type: ConsumerAccount,
    },
  }),
})

export default AccountUpdateDisplayCUrrencyPayload
