import GraphQLUser from "../object/user"

import IError from "@/graphql/shared/types/abstract/error"
import { GT } from "@/graphql/index"

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
