import { GT } from "@graphql/index"

import IError from "../abstract/error"
import EmailRegistrationId from "../scalar/email-verify-id"
import GraphQLUser from "../object/user"

const UserEmailSetPayload = GT.Object({
  name: "UserEmailSetPayload",
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

export default UserEmailSetPayload
