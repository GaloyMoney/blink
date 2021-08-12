import { GT } from "@graphql/index"

import UserDetails from "../object/user-details"
import UserError from "../object/user-error"

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
