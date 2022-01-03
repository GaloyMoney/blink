import { GT } from "@graphql/index"

import IError from "../abstract/error"
import UserContact from "../object/wallet-contact"

const UserContactUpdateAliasPayload = GT.Object({
  name: "UserContactUpdateAliasPayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    contact: {
      type: UserContact,
    },
  }),
})

export default UserContactUpdateAliasPayload
