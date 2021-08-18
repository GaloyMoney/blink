import { RepositoryError } from "./errors"

export const isRepoError = (obj): boolean => obj instanceof RepositoryError
