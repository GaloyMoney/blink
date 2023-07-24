import { GT } from "@graphql/index"

import GraphQLUser from "../object/user"
import IError from "../abstract/error"

const UserTotpDeletePayload = GT.Object({
  name: "UserTotpDeletePayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    me: {
      type: GraphQLUser,
    },
  }),
})

export default UserTotpDeletePayload
