import * as Accounts from "@app/accounts"
import { GT } from "@graphql/index"
import Account from "../abstract/account"

import Timestamp from "../scalar/timestamp"
import Language from "../scalar/language"
import Phone from "../scalar/phone"
import Contact from "./contact"
import UserQuizQuestion from "./user-quiz-question"

const User = new GT.Object({
  name: "User",
  fields: () => ({
    id: { type: GT.NonNullID },
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
    contacts: {
      type: GT.NonNullList(Contact), // TODO: Make it a Connection Interface
    },
    quizQuestions: {
      type: GT.NonNullList(UserQuizQuestion),
    },
    createdAt: {
      type: GT.NonNull(Timestamp),
    },

    // FUTURE-PLAN: support an `accounts: [Account!]!` here
  }),
})

export default User
