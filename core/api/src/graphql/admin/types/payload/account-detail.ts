import GraphQLAccount from "../object/account"

import { GT } from "@/graphql/index"
import IError from "@/graphql/shared/types/abstract/error"

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
