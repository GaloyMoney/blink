import { GT } from "@graphql/index"
import IError from "@graphql/types/abstract/error"

import GraphQLAccount from "../object/account"

const AccountDetailPayload = GT.Object({
  name: "AccountDetailPayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    accountDetails: {
      type: GraphQLAccount,
    },
  }),
})

export default AccountDetailPayload
