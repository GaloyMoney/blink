import GraphQLUser from "../object/user"

import IError from "@/graphql/shared/types/abstract/error"
import { GT } from "@/graphql/index"

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
