import { GT } from "@graphql/index"
import IError from "../abstract/error"

import { MerchantUser } from "../object/user"

const UserDetailPayload = new GT.Object({
  name: "UserDetailPayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    userDetails: {
      type: MerchantUser,
    },
  }),
})

export default UserDetailPayload
