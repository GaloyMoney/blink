import { GT } from "@graphql/index"

import IError from "../abstract/error"
import AccountContact from "../object/account-contact"

const AccountContactUpdateAliasPayload = GT.Object({
  name: "UserContactUpdateAliasPayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    contact: {
      type: AccountContact,
    },
  }),
})

export default AccountContactUpdateAliasPayload
