import { CantConnectToMongoDbError, UnknownRepositoryError } from "@domain/errors"

export const parseRepositoryError = (err: Error) => {
  switch (true) {
    case err.message.includes("MongoNetworkTimeoutError: connection timed out"):
    case err.message.includes("MongooseServerSelectionError: connection timed out"):
      return new CantConnectToMongoDbError()
    default:
      return new UnknownRepositoryError(err.message)
  }
}
