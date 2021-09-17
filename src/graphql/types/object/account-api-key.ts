import { GT } from "@graphql/index"
import AccountApiKeyLabel from "../scalar/account-api-key-label"
import Timestamp from "../scalar/timestamp"

const AccountApiKey = new GT.Object({
  name: "AccountApiKey",
  fields: () => ({
    label: { type: GT.NonNull(AccountApiKeyLabel) },
    key: { type: GT.NonNull(GT.String) },
    secret: { type: GT.NonNull(GT.String) },
    expireAt: { type: GT.NonNull(Timestamp) },
  }),
})

export default AccountApiKey
