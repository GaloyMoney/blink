import { GT } from "@graphql/index"

import Timestamp from "../scalar/timestamp"
import Phone from "../scalar/phone"
import AccountLevel from "../scalar/account-level"
import AccountStatus from "../scalar/account-status"
import Coordinates from "./coordinates"

// TODO: Merge with User type
const UserDetails = new GT.Object({
  name: "UserDetails",
  fields: () => ({
    id: {
      type: GT.NonNullID,
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
