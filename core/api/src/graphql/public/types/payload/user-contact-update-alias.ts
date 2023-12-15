import IError from "../../../shared/types/abstract/error"
import AccountContact from "../object/account-contact"

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
