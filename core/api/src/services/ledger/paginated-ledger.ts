// The paginatedLedger function is a copy of medici's MainBook.ledger function
// but without the page/perPage logic and with new args first/last
// that paginate the database response based on the transaction _id field

// This should be used for any list of transactions that's exposed in the API

import { Types } from "mongoose"
import { parseFilterQuery } from "medici/build/helper/parse/parseFilterQuery"

import { MainBook } from "./books"

import { translateToLedgerTx } from "./translate"

import { Transaction } from "@/services/ledger/schema"
import { checkedToPaginatedQueryCursor } from "@/domain/primitives"

type LedgerQueryFilter = {
  mediciFilters: {
    account?: string | string[]
    _journal?: Types.ObjectId | string
    start_date?: Date | string | number
    end_date?: Date | string | number
  }
  username?: string
  addresses?: OnChainAddress[]
  externalIdSubstring?: LedgerExternalIdSubstring
}

export const paginatedLedger = async ({
  filters,
  paginationArgs,
}: {
  filters: LedgerQueryFilter
  paginationArgs: PaginatedQueryArgs
}): Promise<Error | PaginatedQueryResult<LedgerTransaction<WalletCurrency>>> => {
  const filterQuery = parseFilterQuery(filters.mediciFilters, MainBook)

  const { first, last, before, after } = paginationArgs

  filterQuery["_id"] = { $exists: true }

  if (after) {
    filterQuery["_id"] = { $lt: new Types.ObjectId(after) }
  }

  if (before) {
    filterQuery["_id"] = { $gt: new Types.ObjectId(before) }
  }

  if (filters.username) {
    filterQuery["username"] = filters.username
  }

  if (filters.addresses) {
    filterQuery["payee_addresses"] = { $in: filters.addresses }
  }

  if (filters.externalIdSubstring) {
    filterQuery["external_id"] = { $regex: filters.externalIdSubstring }
  }

  const documentCount = await Transaction.countDocuments(filterQuery)

  // hasPreviousPage and hasNextPage can default to false for the opposite pagination direction per the Connection spec
  let hasPreviousPage = false
  let hasNextPage = false
  let transactionRecords: ILedgerTransaction[] = []

  if (first !== undefined) {
    if (documentCount > first) {
      hasNextPage = true
    }

    transactionRecords = await Transaction.collection
      .find<ILedgerTransaction>(filterQuery)
      .sort({ _id: -1 })
      .limit(first)
      .toArray()
  } else {
    let skipAmount = 0
    if (documentCount > last) {
      hasPreviousPage = true
      skipAmount = documentCount - last
    }

    transactionRecords = await Transaction.collection
      .find<ILedgerTransaction>(filterQuery)
      .sort({ _id: -1 })
      .skip(skipAmount)
      .toArray()
  }

  const txs = transactionRecords.map((tx) => translateToLedgerTx(tx))

  return {
    edges: txs.map((tx) => ({
      cursor: checkedToPaginatedQueryCursor(tx.id),
      node: tx,
    })),
    pageInfo: {
      startCursor: txs[0]?.id ? checkedToPaginatedQueryCursor(txs[0].id) : undefined,
      endCursor: txs[txs.length - 1]?.id
        ? checkedToPaginatedQueryCursor(txs[txs.length - 1].id)
        : undefined,
      hasPreviousPage,
      hasNextPage,
    },
  }
}
