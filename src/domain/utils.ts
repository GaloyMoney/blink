import { RepositoryError, UnknownRepositoryError } from "./errors"

export const isRepoError = (obj): boolean =>
  obj instanceof RepositoryError || obj instanceof UnknownRepositoryError
