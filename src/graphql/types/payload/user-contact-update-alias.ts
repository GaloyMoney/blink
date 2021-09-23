import { GT } from "@graphql/index"
import IError from "../abstract/error"
import { UserDetails } from "../object/user"

const UserContactUpdateAliasPayload = new GT.Object({
  name: "UserContactUpdateAliasPayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    user: {
      type: UserDetails,
    },
  }),
})

export default UserContactUpdateAliasPayload
