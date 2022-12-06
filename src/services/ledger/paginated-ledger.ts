// The paginatedLedger function is a copy of medici's MainBook.ledger function
// but without the page/perPage logic and with new args first/last
// that paginate the database response based on the transaction _id field

// This should be used for any list of transactions that's exposed in the API

import { ClientSession, Types } from "mongoose"

import { parseFilterQuery } from "medici/build/helper/parse/parseFilterQuery"

import { Transaction } from "@services/ledger/schema"

import { MainBook } from "./books"

export const DEFAULT_MAX_CONNECTION_LIMIT = 100

type IFilterQuery = {
  account?: string | string[]
  _journal?: Types.ObjectId | string
  start_date?: Date | string | number
  end_date?: Date | string | number
} & Partial<ILedgerTransaction> & {
    [key: string]: string[] | number | string | Date | boolean | Types.ObjectId
  }

type IOptions = {
  session?: ClientSession
}

export const paginatedLedger = async (
  query: IFilterQuery & PaginationArgs,
  options = {} as IOptions,
) => {
  const { after, before, ...restOfQuery } = query

  const filterQuery = parseFilterQuery(restOfQuery, MainBook)

  if (after) {
    filterQuery["_id"] = { $lt: new Types.ObjectId(after) }
  }

  if (before) {
    filterQuery["_id"] = { $gt: new Types.ObjectId(before) }
  }

  return Transaction.collection
    .find(filterQuery, {
      limit: DEFAULT_MAX_CONNECTION_LIMIT,
      sort: {
        datetime: -1,
        timestamp: -1,
      },
      session: options.session,
    })
    .toArray()
}
