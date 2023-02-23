// The paginatedLedger function is a copy of medici's MainBook.ledger function
// but without the page/perPage logic and with new args first/last
// that paginate the database response based on the transaction _id field

// This should be used for any list of transactions that's exposed in the API

import { Types } from "mongoose"
import { parseFilterQuery } from "medici/build/helper/parse/parseFilterQuery"

import { InvalidPaginationArgumentsError } from "@domain/ledger"
import { Transaction } from "@services/ledger/schema"

import { MainBook } from "./books"

export const DEFAULT_MAX_CONNECTION_LIMIT = 100

type IFilterQuery = {
  account?: string | string[]
  _journal?: Types.ObjectId | string
  start_date?: Date | string | number
  end_date?: Date | string | number
} & Partial<ILedgerTransaction>

export const paginatedLedger = async ({
  query,
  paginationArgs,
}: {
  query: IFilterQuery
  paginationArgs?: PaginationArgs
}): Promise<Error | PaginatedArray<ILedgerTransaction>> => {
  const filterQuery = parseFilterQuery(query, MainBook)

  const { first, after, last, before } = paginationArgs || {}

  if (
    (first !== undefined && last !== undefined) ||
    (after !== undefined && before !== undefined)
  ) {
    return new InvalidPaginationArgumentsError()
  }

  if (after) {
    filterQuery["_id"] = { $lt: new Types.ObjectId(after) }
  }

  if (before) {
    filterQuery["_id"] = { $gt: new Types.ObjectId(before) }
  }

  let limit = first ?? DEFAULT_MAX_CONNECTION_LIMIT
  let skip = 0

  const total = await Transaction.countDocuments(filterQuery)

  if (last) {
    limit = last
    if (total > last) {
      skip = total - last
    }
  }

  const slice = await Transaction.collection
    .find<ILedgerTransaction>(filterQuery)
    .sort({ datetime: -1, timestamp: -1, _id: -1 })
    .allowDiskUse()
    .limit(limit)
    .skip(skip)
    .toArray()

  return {
    slice,
    total,
  }
}
