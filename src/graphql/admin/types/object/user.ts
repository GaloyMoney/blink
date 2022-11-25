import { Accounts } from "@app"
import { mapAndParseErrorForGqlResponse } from "@graphql/error-map"
import { GT } from "@graphql/index"
import Language from "@graphql/types/scalar/language"
import Phone from "@graphql/types/scalar/phone"
import Timestamp from "@graphql/types/scalar/timestamp"

import Account from "./account"

const User = GT.Object<IdentityPhone>({
  name: "User",

  fields: () => ({
    id: { type: GT.NonNullID },
    phone: { type: GT.NonNull(Phone) },
    language: { type: GT.NonNull(Language) },
    defaultAccount: {
      type: GT.NonNull(Account),
      resolve: async (source) => {
        const account = await Accounts.getAccountFromUserId(source.id)
        if (account instanceof Error) {
          throw mapAndParseErrorForGqlResponse(account)
        }
        return account
      },
    },
    createdAt: {
      type: GT.NonNull(Timestamp),
    },
  }),
})

export default User
