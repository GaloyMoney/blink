import { GT } from "@graphql/index"
import UserError from "../abstract/user-error"

import UserDetails from "../object/user-details"

const UserDetailPayload = new GT.Object({
  name: "UserDetailPayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(UserError),
    },
    userDetails: {
      type: UserDetails,
    },
  }),
})

export default UserDetailPayload
