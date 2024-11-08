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

  if (filters.username) {
    filterQuery["username"] = filters.username
  }

  if (filters.addresses) {
    filterQuery["payee_addresses"] = { $in: filters.addresses }
  }

  // hasPreviousPage and hasNextPage can default to false for the opposite pagination direction per the Connection spec
  let hasNextPage = false
  let hasPreviousPage = false
  let transactionRecords: ILedgerTransaction[] = []

  // Optimize for forward pagination (first/after)
  if (first !== undefined) {
    const query = { ...filterQuery }
    if (after) {
      query["_id"] = { $lt: new Types.ObjectId(after) }
    }

    // Fetch one extra record to determine if there are more pages
    transactionRecords = await Transaction.collection
      .find<ILedgerTransaction>(query)
      .sort({ _id: -1 })
      .limit(first + 1)
      .toArray()

    if (transactionRecords.length > first) {
      hasNextPage = true
      transactionRecords = transactionRecords.slice(0, first)
    }
  }
  // Optimize for backward pagination (last/before)
  else if (last !== undefined) {
    const query = { ...filterQuery }
    if (before) {
      query["_id"] = { $gt: new Types.ObjectId(before) }
    }

    // For backward pagination, we:
    // 1. Sort in ascending order to get the oldest records first
    // 2. Limit to last + 1 to check for previous page
    // 3. Reverse the results to maintain consistent ordering
    transactionRecords = await Transaction.collection
      .find<ILedgerTransaction>(query)
      .sort({ _id: 1 })
      .limit(last + 1)
      .toArray()

    if (transactionRecords.length > last) {
      hasPreviousPage = true
      transactionRecords = transactionRecords.slice(1) // Remove the extra record
    }

    // Reverse the results to maintain consistent ordering (newest first)
    transactionRecords = transactionRecords.reverse()
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
