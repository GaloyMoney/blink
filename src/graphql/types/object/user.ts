import dedent from "dedent"

import { GT } from "@graphql/index"

import { Accounts, Users } from "@app"

import { mapError } from "@graphql/error-map"
import { UnknownClientError } from "@graphql/error"

import { baseLogger } from "@services/logger"

// FIXME should not use service
import { IdentityRepository } from "@services/kratos"

import Account from "../abstract/account"

import Language from "../scalar/language"
import Phone from "../scalar/phone"
import Timestamp from "../scalar/timestamp"

import Username from "../scalar/username"

import AccountContact from "./account-contact"
import UserQuizQuestion from "./user-quiz-question"
import GraphQLEmail from "./email"

const GraphQLUser = GT.Object<User, GraphQLContextAuth>({
  name: "User",
  fields: () => ({
    id: {
      type: GT.NonNullID,
    },

    phone: {
      type: Phone,
      description: "Phone number with international calling code.",
    },

    email: {
      type: GraphQLEmail,
      description: "Email address",
      resolve: async (source, _args, { domainAccount }) => {
        const identity = await IdentityRepository().getIdentity(
          domainAccount.kratosUserId,
        )
        if (identity instanceof Error) throw mapError(identity)
        return identity
      },
    },

    totpEnabled: {
      type: GT.NonNull(GT.Boolean),
      description: "Whether TOTP is enabled for this user.",
      resolve: async (source, _args, { domainAccount }) => {
        // FIXME we should not fetch identity twice if email and totp are both requested
        const identity = await IdentityRepository().getIdentity(
          domainAccount.kratosUserId,
        )
        if (identity instanceof Error) throw mapError(identity)
        return identity.totpEnabled
      },
    },

    username: {
      type: Username,
      description: "Optional immutable user friendly identifier.",
      resolve: async (source, args, { domainAccount }) => {
        return domainAccount?.username
      },
      deprecationReason: "will be moved to @Handle in Account and Wallet",
    },

    language: {
      type: GT.NonNull(Language),
      description: dedent`Preferred language for user.
        When value is 'default' the intent is to use preferred language from OS settings.`,
      resolve: async (source, _args, { domainAccount }) => {
        if (source.language || source.language === "") return source.language

        // fallback when source is different from user type
        const userId = domainAccount?.kratosUserId
        if (!userId) return ""

        const user = await Users.getUser(userId)
        if (user instanceof Error) throw mapError(user)

        return user.language
      },
    },

    quizQuestions: {
      deprecationReason: `use Quiz from Account instead`,
      type: GT.NonNullList(UserQuizQuestion),
      description: "List the quiz questions the user may have completed.",
      resolve: async (source, args, { domainAccount }) => {
        return domainAccount?.quizQuestions
      },
    },

    contacts: {
      deprecationReason: "will be moved to account",
      type: GT.NonNullList(AccountContact), // TODO: Make it a Connection Interface
      description: dedent`Get full list of contacts.
        Can include the transactions associated with each contact.`,
      resolve: async (source, args, { domainAccount }) => domainAccount?.contacts,
    },

    contactByUsername: {
      type: GT.NonNull(AccountContact),
      description: dedent`Get single contact details.
        Can include the transactions associated with the contact.`,
      deprecationReason: `will be moved to Accounts`,
      args: {
        username: { type: GT.NonNull(Username) },
      },
      resolve: async (source, args, { domainAccount }) => {
        const { username } = args
        if (!domainAccount) {
          throw new UnknownClientError({
            message: "Something went wrong",
            logger: baseLogger,
          })
        }
        if (username instanceof Error) {
          throw username
        }
        const contact = await Accounts.getContactByUsername({
          account: domainAccount,
          contactUsername: username,
        })
        if (contact instanceof Error) {
          throw mapError(contact)
        }

        return contact
      },
    },

    createdAt: {
      type: GT.NonNull(Timestamp),
    },

    defaultAccount: {
      type: GT.NonNull(Account),
      resolve: async (source, args, { domainAccount }) => {
        return domainAccount
      },
    },

    // FUTURE-PLAN: support an `accounts: [Account!]!` here
  }),
})

export default GraphQLUser
