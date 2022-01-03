import { GT } from "@graphql/index"

import IError from "../abstract/error"
import GraphQLUser from "../object/graphql-user"

const UserUpdateUsernamePayload = GT.Object({
  name: "UserUpdateUsernamePayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    user: {
      type: GraphQLUser,
    },
  }),
})

export default UserUpdateUsernamePayload
