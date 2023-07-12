import { GT } from "@graphql/index"

import IError from "../abstract/error"
import GraphQLUser from "../object/user"

const UserTotpRegistrationValidatePayload = GT.Object({
  name: "UserTotpRegistrationValidatePayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    me: {
      type: GraphQLUser,
    },
  }),
})

export default UserTotpRegistrationValidatePayload
