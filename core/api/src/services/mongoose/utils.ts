import { Types } from "mongoose"

import {
  CannotConnectToDbError,
  DbConnectionClosedError,
  DuplicateKeyForPersistError,
  InvalidDocumentIdForDbError,
  UnknownRepositoryError,
} from "@/domain/errors"
import { parseErrorMessageFromUnknown } from "@/domain/shared"

export const isValidObjectId = <T extends string>(id: T): boolean => {
  return Types.ObjectId.isValid(id)
}

export const toObjectId = <T extends string>(id: T): Types.ObjectId => {
  return new Types.ObjectId(id)
}

export const fromObjectId = <T extends string>(id: Types.ObjectId | string): T => {
  return String(id) as T
}

export const parseRepositoryError = (err: Error | string | unknown) => {
  const errMsg = parseErrorMessageFromUnknown(err)

  const match = (knownErrDetail: RegExp): boolean => knownErrDetail.test(errMsg)

  switch (true) {
    case match(KnownRepositoryErrorMessages.MongoNetworkTimeout):
    case match(KnownRepositoryErrorMessages.MongoServerSelectionTimeout):
    case match(KnownRepositoryErrorMessages.MongoAddrNotFound):
    case match(KnownRepositoryErrorMessages.MongoConnectionRefused):
      return new CannotConnectToDbError()

    case match(KnownRepositoryErrorMessages.MongoConnectionClosed):
      return new DbConnectionClosedError()

    case match(KnownRepositoryErrorMessages.MongoInvalidDocumentId):
      return new InvalidDocumentIdForDbError()

    case match(KnownRepositoryErrorMessages.MongoDuplicateKeyForPersist):
      return new DuplicateKeyForPersistError()

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

  MongoInvalidDocumentId:
    /Argument passed in must be a string of 12 bytes or a string of 24 hex characters or an integer/,
  MongoDuplicateKeyForPersist: /E11000 duplicate key error collection/,
} as const
