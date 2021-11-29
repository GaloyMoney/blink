import dedent from "dedent"
import { GT } from "@graphql/index"

import { connectionArgs, connectionFromArray } from "graphql-relay"
import { TransactionConnection } from "../abstract/transaction"

import ContactAlias from "../scalar/contact-alias"
import * as Accounts from "@app/accounts"
import Username from "../scalar/username"
import { checkedToUsername } from "@domain/users"

const UserContact = new GT.Object({
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
      resolve: async (source, args, { domainUser }) => {
        const contactUsername = checkedToUsername(source.username)

        if (contactUsername instanceof Error) {
          throw contactUsername
        }

        // TODO: figure out what to do here when we have multiple accounts
        const account = await Accounts.getAccount(domainUser.defaultAccountId)

        if (account instanceof Error) {
          throw account
        }

        const transactions = await Accounts.getAccountTransactionsForContact({
          account,
          contactUsername,
        })

        if (transactions instanceof Error) {
          throw transactions
        }

        return connectionFromArray(transactions, args)
      },
      description: "Paginated list of transactions sent to/from this contact.",
    },
  }),
})

export default UserContact
