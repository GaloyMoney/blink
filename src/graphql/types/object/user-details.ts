import { GT } from "@graphql/index"

import Timestamp from "../scalars/timestamp"
import Phone from "../scalars/phone"
import AccountLevel from "../scalars/account-level"
import Username from "../scalars/username"
import AccountStatus from "../scalars/account-status"
import Coordinates from "./coordinates"

// TODO: Merge with User type
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
      type: GT.NonNull(Timestamp),
      resolve: (source) => source.created_at,
    },
  }),
})

export default UserDetails
