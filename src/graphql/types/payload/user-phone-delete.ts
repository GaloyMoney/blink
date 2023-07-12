import { GT } from "@graphql/index"

import GraphQLUser from "../object/user"
import IError from "../abstract/error"

const UserPhoneDeletePayload = GT.Object({
  name: "UserPhoneDeletePayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    me: {
      type: GraphQLUser,
    },
  }),
})

export default UserPhoneDeletePayload
