import { GT } from "@graphql/index"
import IError from "../abstract/error"

import { UserDetails } from "../object/user"

const UserUpdateLanguagePayload = new GT.Object({
  name: "UserUpdateLanguagePayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    user: {
      type: UserDetails,
    },
  }),
})

export default UserUpdateLanguagePayload
