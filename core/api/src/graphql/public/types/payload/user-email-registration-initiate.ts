import EmailRegistrationId from "../scalar/email-verify-id"
import GraphQLUser from "../object/user"

import IError from "@/graphql/shared/types/abstract/error"
import { GT } from "@/graphql/index"

const UserEmailRegistrationInitiatePayload = GT.Object({
  name: "UserEmailRegistrationInitiatePayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    emailRegistrationId: {
      type: EmailRegistrationId,
    },
    me: {
      type: GraphQLUser,
    },
  }),
})

export default UserEmailRegistrationInitiatePayload
