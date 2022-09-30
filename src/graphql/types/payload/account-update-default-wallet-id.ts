import { GT } from "@graphql/index"

import AppError from "../object/app-error"
import ConsumerAccount from "../object/consumer-account"

const AccountUpdateDefaultWalletIdPayload = GT.Object({
  name: "AccountUpdateDefaultWalletIdPayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(AppError),
    },
    account: {
      type: ConsumerAccount,
    },
  }),
})

export default AccountUpdateDefaultWalletIdPayload
