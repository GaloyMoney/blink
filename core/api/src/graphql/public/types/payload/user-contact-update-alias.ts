import AccountContact from "../object/account-contact"

import IError from "@/graphql/shared/types/abstract/error"
import { GT } from "@/graphql/index"

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
