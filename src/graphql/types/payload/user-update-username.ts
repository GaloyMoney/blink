import { GT } from "@graphql/index"

import AppError from "../object/app-error"
import GraphQLUser from "../object/graphql-user"

const UserUpdateUsernamePayload = GT.Object({
  name: "UserUpdateUsernamePayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(AppError),
    },
    user: {
      type: GraphQLUser,
    },
  }),
})

export default UserUpdateUsernamePayload
