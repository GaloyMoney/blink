import { GT } from "@graphql/index"
import AccountApiKeyLabel from "../scalar/account-api-key-label"
import Timestamp from "../scalar/timestamp"

const AccountApiKeyHashed = new GT.Object({
  name: "AccountApiKeyHashed",
  fields: () => ({
    label: { type: GT.NonNull(AccountApiKeyLabel) },
    expireAt: { type: GT.NonNull(Timestamp) },
  }),
})

export default AccountApiKeyHashed
