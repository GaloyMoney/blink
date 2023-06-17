import { GT } from "@graphql/index"

import IError from "../abstract/error"
import GraphQLUser from "../object/user"

const UserUpdateUsernamePayload = GT.Object({
  name: "UserUpdateUsernamePayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    // FIXME: should be me {} instead of user {}
    user: {
      type: GraphQLUser,
    },
  }),
})

export default UserUpdateUsernamePayload
