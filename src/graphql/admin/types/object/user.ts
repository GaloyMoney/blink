import { GT } from "@graphql/index"

import Language from "@graphql/types/scalar/language"
import Phone from "@graphql/types/scalar/phone"
import Timestamp from "@graphql/types/scalar/timestamp"
import Account from "./account"

const User = new GT.Object({
  name: "User",
  fields: () => ({
    id: { type: GT.NonNullID },
    phone: { type: GT.NonNull(Phone) },
    language: { type: GT.NonNull(Language) },
    defaultAccount: {
      // FIXME
      type: Account,
      resolve: (source) => source.account,
    },
    createdAt: {
      type: GT.NonNull(Timestamp),
      resolve: (source) => source.createdAt ?? source.created_at, // TODO: Get rid of this resolver
    },
  }),
})

export default User
