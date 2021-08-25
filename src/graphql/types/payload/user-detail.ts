import { GT } from "@graphql/index"
import IError from "../abstract/error"

import UserDetails from "../object/user-details"

const UserDetailPayload = new GT.Object({
  name: "UserDetailPayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    userDetails: {
      type: UserDetails,
    },
  }),
})

export default UserDetailPayload
