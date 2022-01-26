import { GT } from "@graphql/index"

const AccountStatus = GT.Enum({
  name: "AccountStatus",
  values: {
    LOCKED: { value: "locked" },
    ACTIVE: { value: "active" },
  },
})

export default AccountStatus
