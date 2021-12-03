import { GT } from "@graphql/index"

import AccountLevel from "../scalar/account-level"
import AccountStatus from "../scalar/account-status"

import Coordinates from "@graphql/types/object/coordinates"
import Language from "@graphql/types/scalar/language"
import Phone from "@graphql/types/scalar/phone"
import Timestamp from "@graphql/types/scalar/timestamp"
import Username from "@graphql/types/scalar/username"

const User = new GT.Object({
  name: "User",
  fields: () => ({
    id: { type: GT.NonNullID },
    phone: { type: GT.NonNull(Phone) },
    username: { type: Username },
    language: { type: GT.NonNull(Language) },
    level: { type: AccountLevel },
    status: { type: AccountStatus },
    title: { type: GT.String },
    coordinates: {
      type: Coordinates,
      resolve: (source) => source.coordinates,
    },
    createdAt: {
      type: GT.NonNull(Timestamp),
      resolve: (source) => source.createdAt ?? source.created_at, // TODO: Get rid of this resolver
    },
  }),
})

export default User
