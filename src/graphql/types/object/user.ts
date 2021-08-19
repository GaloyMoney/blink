import * as Accounts from "@app/accounts"
import { GT } from "@graphql/index"
import Account from "../abstract/account"

import Timestamp from "../scalars/timestamp"
import Language from "../scalars/language"
import Phone from "../scalars/phone"
import Username from "../scalars/username"

const User = new GT.Object({
  name: "User",
  fields: () => ({
    id: { type: GT.NonNullID },
    username: { type: Username }, // TODO: make username required
    phone: { type: GT.NonNull(Phone) },
    language: {
      type: GT.NonNull(Language),
      resolve: (source) => source.language,
    },

    defaultAccount: {
      type: GT.NonNull(Account),
      resolve: async (source) => {
        const account = await Accounts.getAccount(source.defaultAccountId)
        if (account instanceof Error) {
          throw account
        }

        return account
      },
    },

    // TODO: contacts, quizQuestions

    createdAt: {
      type: GT.NonNull(Timestamp),
      resolve: (source) => source.createdAt,
    },
  }),
})

export default User
