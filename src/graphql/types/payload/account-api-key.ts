import { GT } from "@graphql/index"
import IError from "../abstract/error"

import AccountApiKey from "../object/account-api-key"

const AccountApiKeyPayload = new GT.Object({
  name: "AccountApiKeyPayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    accountApiKey: {
      type: AccountApiKey,
    },
  }),
})

export default AccountApiKeyPayload
