import { GT } from "@graphql/index"

import AccountLevel from "../scalar/account-level"
import AccountStatus from "../scalar/account-status"

import Coordinates from "@graphql/types/object/coordinates"
import Language from "@graphql/types/scalar/language"
import Phone from "@graphql/types/scalar/phone"
import Timestamp from "@graphql/types/scalar/timestamp"
import WalletName from "@graphql/types/scalar/wallet-name"

const UserDetails = new GT.Object({
  name: "UserDetails",
  fields: () => ({
    id: { type: GT.NonNullID },
    phone: { type: GT.NonNull(Phone) },
    walletName: {
      type: WalletName,
      resolve: (source) => source.username,
    },
    language: {
      type: GT.NonNull(Language),
      resolve: (source) => source.language || "en",
    },
    level: { type: AccountLevel },
    status: { type: AccountStatus },
    title: { type: GT.String },
    coordinates: {
      type: Coordinates,
      resolve: (source) => source.coordinate,
    },
    createdAt: {
      type: GT.NonNull(Timestamp),
      resolve: (source) => source.createdAt ?? source.created_at, // TODO: Get rid of this resolver
    },
  }),
})

export default UserDetails
