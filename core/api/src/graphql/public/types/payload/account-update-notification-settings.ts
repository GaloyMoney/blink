import IError from "../../../shared/types/abstract/error"
import ConsumerAccount from "../object/consumer-account"

import { GT } from "@/graphql/index"

const AccountUpdateNotificationSettingsPayload = GT.Object({
  name: "AccountUpdateNotificationSettingsPayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    account: {
      type: ConsumerAccount,
    },
  }),
})

export default AccountUpdateNotificationSettingsPayload
