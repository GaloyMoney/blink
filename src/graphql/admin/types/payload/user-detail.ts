import { GT } from "@graphql/index"
import IError from "@graphql/types/abstract/error"
import UserDetails from "../object/user"

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
