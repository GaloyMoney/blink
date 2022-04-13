import { GT } from "@graphql/index"

const AccountStatus = GT.Enum({
  name: "AccountStatus",
  values: {
    NEW: { value: "new" },
    PENDING: { value: "pending" },
    ACTIVE: { value: "active" },
    LOCKED: { value: "locked" },
  },
})

export default AccountStatus
