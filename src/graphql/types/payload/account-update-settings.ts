import { GT } from "@graphql/index"

import IError from "../abstract/error"
import AccountSettings from "../object/account-settings"

const AccountUpdateSettingsPayload = GT.Object({
  name: "AccountUpdateSettingsPayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    settings: {
      type: AccountSettings,
    },
  }),
})

export default AccountUpdateSettingsPayload
