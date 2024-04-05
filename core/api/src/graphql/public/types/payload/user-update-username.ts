import GraphQLUser from "../object/user"

import IError from "@/graphql/shared/types/abstract/error"

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
