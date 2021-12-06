import { GT } from "@graphql/index"
import Language from "@graphql/types/scalar/language"
import Phone from "@graphql/types/scalar/phone"
import Timestamp from "@graphql/types/scalar/timestamp"
import { AccountsRepository } from "@services/mongoose"
import Account from "./account"

const User = new GT.Object({
  name: "User",

  fields: () => ({
    id: { type: GT.NonNullID },
    phone: { type: GT.NonNull(Phone) },
    language: { type: GT.NonNull(Language) },
    defaultAccount: {
      type: GT.NonNull(Account),
      resolve: async (source: User) => {
        const account = await AccountsRepository().findById(source.defaultAccountId)
        if (account instanceof Error) {
          throw account
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
