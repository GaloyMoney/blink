import { GT } from "@graphql/index"

import { Wallets } from "@app"
import TransactionWithMetadata from "@graphql/types/object/transaction-with-metadata"
import { WalletsRepository } from "@services/mongoose"
import {
  InvalidLedgerTransaction,
  NotAuthorizedForTransactionError,
} from "@domain/errors"
import { mapError } from "@graphql/error-map"

const TransactionByIdQuery = GT.Field({
  type: TransactionWithMetadata,
  args: {
    id: { type: GT.NonNullID },
  },
  resolve: async (_, args, { domainAccount }: { domainAccount: Account }) => {
    const { id } = args

    if (id instanceof Error) throw id

    const wallets = await WalletsRepository().listByAccountId(domainAccount.id)
    if (wallets instanceof Error) throw mapError(wallets)
    const walletIds = wallets.map((wallet) => wallet.id)

    const ledgerTx = await Wallets.getTransactionById(id)
    if (ledgerTx instanceof Error) throw mapError(ledgerTx)

    if (ledgerTx.walletId === undefined) {
      throw mapError(new InvalidLedgerTransaction())
    }
    if (!walletIds.includes(ledgerTx.walletId)) {
      throw mapError(new NotAuthorizedForTransactionError())
    }

    return ledgerTx
  },
})

export default TransactionByIdQuery
