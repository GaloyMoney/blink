import dedent from "dedent"

// FIXME should not use service

import Account from "../abstract/account"

import Language from "../../../shared/types/scalar/language"
import Phone from "../../../shared/types/scalar/phone"
import Timestamp from "../../../shared/types/scalar/timestamp"

import Username from "../../../shared/types/scalar/username"

import GraphQLEmail from "../../../shared/types/object/email"

import AccountContact from "./account-contact"
import UserQuizQuestion from "./user-quiz-question"

import { IdentityRepository } from "@/services/kratos"
import { UnknownClientError } from "@/graphql/error"
import { baseLogger } from "@/services/logger"
import { Accounts } from "@/app"
import { mapError } from "@/graphql/error-map"
import { GT } from "@/graphql/index"

const GraphQLUser = GT.Object<User, GraphQLPublicContextAuth>({
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
        // FIXME: avoid fetching identity twice
        const identity = await IdentityRepository().getIdentity(
          domainAccount.kratosUserId,
        )
        if (identity instanceof Error) throw mapError(identity)
        return { address: identity.email, verified: identity.emailVerified }
      },
    },

    totpEnabled: {
      type: GT.NonNull(GT.Boolean),
      description: "Whether TOTP is enabled for this user.",
      resolve: async (source, _args, { domainAccount }) => {
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
