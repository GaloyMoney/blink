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

export const parseRepositoryError = (err: Error | string) => {
  const errMsg = typeof err === "string" ? err : err.message

  const match = (knownErrDetail: RegExp): boolean => knownErrDetail.test(errMsg)

  switch (true) {
    case match(KnownRepositoryErrorMessages.MongoNetworkTimeout):
    case match(KnownRepositoryErrorMessages.MongoServerSelectionTimeout):
    case match(KnownRepositoryErrorMessages.MongoAddrNotFound):
    case match(KnownRepositoryErrorMessages.MongoConnectionRefused):
      return new CannotConnectToDbError()

    case match(KnownRepositoryErrorMessages.MongoConnectionClosed):
      return new DbConnectionClosedError()

    default:
      return new UnknownRepositoryError(errMsg)
  }
}

const KnownRepositoryErrorMessages = {
  MongoNetworkTimeout: /MongoNetworkTimeoutError: connection timed out/,
  MongoServerSelectionTimeout: /MongooseServerSelectionError: connection timed out/,
  MongoAddrNotFound: /MongooseServerSelectionError: getaddrinfo ENOTFOUND/,
  MongoConnectionRefused: /MongooseServerSelectionError: connect ECONNREFUSED/,
  MongoConnectionClosed: /connection .+ to .+ closed/,
} as const
