import { GT } from "@graphql/index"

import IError from "../abstract/error"
import Username from "../scalar/username"

const UserUsernameDetails = new GT.Object({
  name: "UserUsernameDetails",
  fields: () => ({
    id: { type: GT.NonNullID },
    username: { type: GT.NonNull(Username) },
  }),
})

const UserUpdateUsernamePayload = new GT.Object({
  name: "UserUpdateUsernamePayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    user: {
      type: UserUsernameDetails,
    },
  }),
})

export default UserUpdateUsernamePayload
