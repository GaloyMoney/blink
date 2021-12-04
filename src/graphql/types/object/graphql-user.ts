import getUuidByString from "uuid-by-string"
import dedent from "dedent"

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

const GraphQLUser = new GT.Object({
  name: "User",
  fields: () => ({
    id: {
      type: GT.NonNullID,
      resolve: (source) => getUuidByString(source.id),
    },

    phone: {
      type: GT.NonNull(Phone),
      description: "Phone number with international calling code.",
    },
    username: {
      type: Username,
      description: "Optional immutable user friendly identifier.",
    },
    language: {
      type: GT.NonNull(Language),
      description: dedent`Preferred language for user.
        When value is 'default' the intent is to use preferred language from OS settings.`,
    },

    quizQuestions: {
      type: GT.NonNullList(UserQuizQuestion),
      description: "List the quiz questions the user may have completed.",
    },

    contacts: {
      type: GT.NonNullList(UserContact), // TODO: Make it a Connection Interface
      description: dedent`Get full list of contacts.
        Can include the transactions associated with each contact.`,
    },

    contactByUsername: {
      type: GT.NonNull(UserContact),
      description: dedent`Get single contact details.
        Can include the transactions associated with the contact.`,
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

    twoFAEnabled: {
      type: GT.Boolean,
      resolve: (source) => source.twoFA.secret !== null,
    },

    createdAt: {
      type: GT.NonNull(Timestamp),
      resolve: (source) => source.createdAt ?? source.created_at, // TODO: Get rid of this resolver
    },

    defaultAccount: {
      type: GT.NonNull(Account),
      resolve: async (source, args, { domainUser }) => {
        // TODO: could also be return domainAccount
        const account = await Accounts.getAccount(domainUser.defaultAccountId)
        if (account instanceof Error) {
          throw account
        }

        return account
      },
    },

    // FUTURE-PLAN: support an `accounts: [Account!]!` here
  }),
})

export default GraphQLUser
