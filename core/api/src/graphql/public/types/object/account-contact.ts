import dedent from "dedent"

import ContactAlias from "../scalar/contact-alias"

import Username from "../../../shared/types/scalar/username"

import { TransactionConnection } from "../../../shared/types/object/transaction"

import { Accounts } from "@/app"
import { checkedToUsername } from "@/domain/accounts"
import { GT } from "@/graphql/index"
import { connectionArgs } from "@/graphql/connections"
import { mapError } from "@/graphql/error-map"

const AccountContact = GT.Object<AccountRecord, GraphQLPublicContextAuth>({
  name: "UserContact",
  fields: () => ({
    id: { type: GT.NonNull(Username) },
    username: {
      type: GT.NonNull(Username),
      description: "Actual identifier of the contact.",
    },
    alias: {
      type: ContactAlias,
      description: dedent`Alias the user can set for this contact.
        Only the user can see the alias attached to their contact.`,
    },
    transactionsCount: {
      type: GT.NonNull(GT.Int),
    },
    transactions: {
      type: TransactionConnection,
      args: connectionArgs,
      resolve: async (source, args, { domainAccount }) => {
        if (!source.username) {
          throw new Error("Missing username for contact")
        }
        const contactUsername = checkedToUsername(source.username)

        if (contactUsername instanceof Error) {
          throw mapError(contactUsername)
        }

        const account = domainAccount

        if (account instanceof Error) {
          throw account
        }

        const resp = await Accounts.getAccountTransactionsForContact({
          account,
          contactUsername,
          rawPaginationArgs: args,
        })

        if (resp instanceof Error) {
          throw mapError(resp)
        }

        return resp
      },
      description: "Paginated list of transactions sent to/from this contact.",
    },
  }),
})

export default AccountContact
