import { GT } from "../index"

import Date from "./scalars/date"
import Phone from "./scalars/phone"
import AccountLevel from "./account-level"
import Username from "./scalars/username"

const UserDetails = new GT.Object({
  name: "UserDetails",
  fields: () => ({
    id: {
      type: GT.NonNullID,
    },
    username: {
      type: Username,
    },
    phone: {
      type: GT.NonNull(Phone),
    },
    level: {
      type: AccountLevel,
    },
    createdAt: {
      type: GT.NonNull(Date),
      resolve: (source) => source.created_at,
    },
  }),
})

export default UserDetails
