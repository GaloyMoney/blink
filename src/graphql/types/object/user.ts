import { GT } from "@graphql/index"
import Account from "../abstract/account"

import Timestamp from "../scalar/timestamp"
import Language from "../scalar/language"
import Phone from "../scalar/phone"

import UserContact from "./wallet-contact"
import UserQuizQuestion from "./user-quiz-question"
import Username from "../scalar/username"

import * as Accounts from "@app/accounts"
import * as Users from "@app/users"
import { UnknownClientError } from "@core/error"

const mainUserFields = () => ({
  id: { type: GT.NonNullID },
  phone: { type: GT.NonNull(Phone) },
  username: { type: Username },
  language: {
    type: GT.NonNull(Language),
    resolve: (source) => source.language,
  },

  contacts: {
    type: GT.NonNullList(UserContact), // TODO: Make it a Connection Interface
  },

  contactByUsername: {
    type: GT.NonNull(UserContact),
    args: {
      username: { type: GT.NonNull(Username) },
    },
    resolve: async (source, args, { domainUser }) => {
      const { username } = args
      if (username instanceof Error) {
        throw username
      }
      const contact = await Users.getContactByUsername({
        user: domainUser,
        contactUsername: args.username,
      })
      if (contact instanceof Error) {
        throw new UnknownClientError("Something went wrong") // TODO: Map error
      }
      return contact
    },
  },

  quizQuestions: {
    type: GT.NonNullList(UserQuizQuestion),
  },

  twoFAEnabled: {
    type: GT.Boolean,
    resolve: (source) => source.twoFA.secret !== null,
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

export const UserWithAccounts = new GT.Object({
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
