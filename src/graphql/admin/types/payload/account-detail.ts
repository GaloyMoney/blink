import { GT } from "@graphql/index"
import AppError from "@graphql/types/object/app-error"

import GraphQLAccount from "../object/account"

const AccountDetailPayload = GT.Object({
  name: "AccountDetailPayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(AppError),
    },
    accountDetails: {
      type: GraphQLAccount,
    },
  }),
})

export default AccountDetailPayload
