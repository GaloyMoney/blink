import { GT } from "../index"

import Date from "./scalars/date"
import Phone from "./scalars/phone"
import AccountLevel from "./account-level"
import Username from "./scalars/username"
import Coordinates from "./coordinates"
import AccountStatus from "./account-status"

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
    status: {
      type: AccountStatus,
    },
    title: {
      type: GT.String,
    },
    coordinates: {
      type: Coordinates,
      resolve: (source) => source.coordinate,
    },
    createdAt: {
      type: GT.NonNull(Date),
      resolve: (source) => source.created_at,
    },
  }),
})

export default UserDetails
