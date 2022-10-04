import {
  CannotConnectToDbError,
  DbConnectionClosedError,
  UnknownRepositoryError,
} from "@domain/errors"
import { Types } from "mongoose"

export const toObjectId = <T extends string>(id: T): Types.ObjectId => {
  return new Types.ObjectId(id)
}

export const fromObjectId = <T extends string>(id: Types.ObjectId | string): T => {
  return String(id) as T
}

export const parseRepositoryError = (err: Error) => {
  switch (true) {
    case err.message.includes("MongoNetworkTimeoutError: connection timed out"):
    case err.message.includes("MongooseServerSelectionError: connection timed out"):
    case err.message.includes("MongooseServerSelectionError: getaddrinfo ENOTFOUND"):
    case err.message.includes("MongooseServerSelectionError: connect ECONNREFUSED"):
      return new CannotConnectToDbError()
    case /connection .+ to .+ closed/.test(err.message):
      return new DbConnectionClosedError()
    default:
      return new UnknownRepositoryError(err.message)
  }
}
