import IError from "../../../shared/types/abstract/error"
import GraphQLUser from "../object/user"

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
