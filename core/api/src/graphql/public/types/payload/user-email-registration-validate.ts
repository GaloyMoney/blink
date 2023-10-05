import GraphQLUser from "../object/user"
import IError from "../../../shared/types/abstract/error"

import { GT } from "@/graphql/index"

const UserEmailRegistrationValidatePayload = GT.Object({
  name: "UserEmailRegistrationValidatePayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    me: {
      type: GraphQLUser,
    },
  }),
})

export default UserEmailRegistrationValidatePayload
