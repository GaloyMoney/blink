import IError from "../../../shared/types/abstract/error"
import GraphQLUser from "../object/user"

import { GT } from "@/graphql/index"

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
