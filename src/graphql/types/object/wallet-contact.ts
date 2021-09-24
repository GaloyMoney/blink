import { GT } from "@graphql/index"

import { connectionArgs, connectionFromArray } from "graphql-relay"
import { TransactionConnection } from "../abstract/transaction"
import * as Wallets from "@app/wallets"

import ContactAlias from "../scalar/contact-alias"
import * as Accounts from "@app/accounts"

const WalletContact = new GT.Object({
  name: "WalletContact",
  fields: () => ({
    walletName: { type: GT.NonNullID },
    alias: { type: ContactAlias },
    transactionsCount: {
      type: GT.NonNull(GT.Int),
    },

    transactions: {
      type: TransactionConnection,
      args: connectionArgs,
      resolve: async (source, args, { domainUser }) => {
        const contactWalletName = source.walletName as WalletName

        // TODO: figure out what to do here when we have multiple accounts
        const account = await Accounts.getAccount(domainUser.defaultAccountId)

        if (account instanceof Error) {
          throw account
        }

        const transactions = await Wallets.getAccountTransactionsForContact({
          account,
          contactWalletName,
        })

        if (transactions instanceof Error) {
          throw transactions
        }

        return connectionFromArray(transactions, args)
      },
    },
  }),
})

export default WalletContact
