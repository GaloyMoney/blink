import { GT } from "@graphql/index"

import IError from "../../../shared/types/abstract/error"
import ConsumerAccount from "../object/consumer-account"

const AccountUpdateDisplayCurrencyPayload = GT.Object({
  name: "AccountUpdateDisplayCurrencyPayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    account: {
      type: ConsumerAccount,
    },
  }),
})

export default AccountUpdateDisplayCurrencyPayload
