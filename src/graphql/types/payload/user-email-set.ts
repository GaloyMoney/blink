import { GT } from "@graphql/index"

import IError from "../abstract/error"
import Flow from "../scalar/flow"
import GraphQLUser from "../object/user"

const UserEmailSetPayload = GT.Object({
  name: "UserEmailSetPayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    flow: {
      type: Flow,
    },
    me: {
      type: GraphQLUser,
    },
  }),
})

export default UserEmailSetPayload
