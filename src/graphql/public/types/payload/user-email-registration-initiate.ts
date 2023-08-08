import { GT } from "@graphql/index"

import IError from "../../../shared/types/abstract/error"
import EmailRegistrationId from "../scalar/email-verify-id"
import GraphQLUser from "../object/user"

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
