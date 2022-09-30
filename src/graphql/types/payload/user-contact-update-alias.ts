import { GT } from "@graphql/index"

import AppError from "../object/app-error"
import AccountContact from "../object/account-contact"

const AccountContactUpdateAliasPayload = GT.Object({
  name: "UserContactUpdateAliasPayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(AppError),
    },
    contact: {
      type: AccountContact,
    },
  }),
})

export default AccountContactUpdateAliasPayload
