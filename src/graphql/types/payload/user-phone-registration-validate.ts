import { GT } from "@graphql/index"

import GraphQLUser from "../object/user"
import IError from "../abstract/error"

const UserPhoneRegistrationValidatePayload = GT.Object({
  name: "UserPhoneRegistrationValidatePayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    me: {
      type: GraphQLUser,
    },
  }),
})

export default UserPhoneRegistrationValidatePayload
