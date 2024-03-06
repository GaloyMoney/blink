import dedent from "dedent"

import Account from "../abstract/account"

import AccountContact from "./account-contact"

import { Accounts, Users } from "@/app"

import { AccountStatus } from "@/domain/accounts"
import { ScopesOauth2 } from "@/domain/authorization"

import { baseLogger } from "@/services/logger"
// FIXME should not use service
import { IdentityRepository } from "@/services/kratos"

import { GT } from "@/graphql/index"
import { mapError } from "@/graphql/error-map"
import { UnknownClientError } from "@/graphql/error"
import Phone from "@/graphql/shared/types/scalar/phone"
import Scope from "@/graphql/shared/types/scalar/scope"
import Language from "@/graphql/shared/types/scalar/language"
import Username from "@/graphql/shared/types/scalar/username"
import Timestamp from "@/graphql/shared/types/scalar/timestamp"
import GraphQLEmail from "@/graphql/shared/types/object/email"

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
      resolve: async (source) => {
        return Users.getUserLanguage(source)
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

    scopes: {
      type: GT.NonNullList(Scope),
      description:
        "Retrieve the list of scopes permitted for the user's token or API key",
      resolve: async (_source, _args, { domainAccount, scope }) => {
        const isActive = domainAccount.status === AccountStatus.Active

        if (!isActive) {
          return [ScopesOauth2.Read]
        }

        // not a token with scope
        if (scope && scope.length > 0) {
          return scope
        }

        return [ScopesOauth2.Read, ScopesOauth2.Write, ScopesOauth2.Receive]
      },
    },

    // FUTURE-PLAN: support an `accounts: [Account!]!` here
  }),
})

export default GraphQLUser
