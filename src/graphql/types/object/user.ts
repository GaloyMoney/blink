import * as Accounts from "@app/accounts"
import { GT } from "@graphql/index"
import Account from "../abstract/account"

import Timestamp from "../scalar/timestamp"
import Language from "../scalar/language"
import Phone from "../scalar/phone"
import AccountLevel from "../scalar/account-level"
import AccountStatus from "../scalar/account-status"
import Coordinates from "./coordinates"

import WalletContact from "./wallet-contact"
import UserQuizQuestion from "./user-quiz-question"

const mainUserFields = () => ({
  id: { type: GT.NonNullID },
  phone: { type: GT.NonNull(Phone) },
  language: { type: GT.NonNull(Language) },

  contacts: {
    type: GT.NonNullList(WalletContact), // TODO: Make it a Connection Interface
  },

  quizQuestions: {
    type: GT.NonNullList(UserQuizQuestion),
  },

  createdAt: {
    type: GT.NonNull(Timestamp),
    resolve: (source) => source.createdAt ?? source.created_at, // TODO: Get rid of this resolver
  },
})

export const UserDetails = new GT.Object({
  name: "UserDetails",
  fields: () => ({
    ...mainUserFields(),
  }),
})

// TODO: A temp type for the current admin dashboard
export const UserForAdmin = new GT.Object({
  name: "User",
  fields: () => ({
    ...mainUserFields(),
    level: { type: AccountLevel },
    status: { type: AccountStatus },
    title: {
      type: GT.String,
    },
    coordinates: {
      type: Coordinates,
      resolve: (source) => source.coordinate,
    },
  }),
})

const User = new GT.Object({
  name: "User",
  fields: () => ({
    ...mainUserFields(),

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

    // FUTURE-PLAN: support an `accounts: [Account!]!` here
  }),
})

export default User
