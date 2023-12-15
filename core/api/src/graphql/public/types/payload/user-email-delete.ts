import GraphQLUser from "../object/user"
import IError from "../../../shared/types/abstract/error"

import { GT } from "@/graphql/index"

const UserEmailDeletePayload = GT.Object({
  name: "UserEmailDeletePayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    me: {
      type: GraphQLUser,
    },
  }),
})

export default UserEmailDeletePayload
