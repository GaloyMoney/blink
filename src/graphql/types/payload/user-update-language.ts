import { GT } from "@graphql/index"

import GraphQLUser from "../object/graphql-user"
import AppError from "../object/app-error"

const UserUpdateLanguagePayload = GT.Object({
  name: "UserUpdateLanguagePayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(AppError),
    },
    user: {
      type: GraphQLUser,
    },
  }),
})

export default UserUpdateLanguagePayload
