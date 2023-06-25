import { GT } from "@graphql/index"

import GraphQLUser from "../object/user"
import IError from "../abstract/error"

const UserUpdateLanguagePayload = GT.Object({
  name: "UserUpdateLanguagePayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    user: {
      type: GraphQLUser,
    },
  }),
})

export default UserUpdateLanguagePayload
