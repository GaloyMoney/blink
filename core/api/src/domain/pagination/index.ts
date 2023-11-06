import { InvalidPaginationArgsError } from "./errors"

export const parsePaginationArgs = ({
  paginationArgs,
  maxPageSize,
}: {
  paginationArgs?: PaginationArgs
  maxPageSize: number
}): InvalidPaginationArgsError | ParsedPaginationArgs => {
  const { first, last, before, after } = paginationArgs || {}
  if (first && last) {
    return new InvalidPaginationArgsError(`Cannot use both "first" and "last".`)
  }

  if (typeof first === "number") {
    if (first > maxPageSize) {
      return new InvalidPaginationArgsError(
        `Requested page size (${first}) is greater than max allowed page size ${maxPageSize}.`,
      )
    }

    if (first <= 0) {
      return new InvalidPaginationArgsError(
        `Requested page size (${first}) must be greater than 0.`,
      )
    }

    return {
      first,
      after,
      before,
    }
  }

  if (typeof last === "number") {
    if (last > maxPageSize) {
      return new InvalidPaginationArgsError(
        `Requested page size (${last}) is greater than max allowed page size ${maxPageSize}.`,
      )
    }

    if (last <= 0) {
      return new InvalidPaginationArgsError(
        `Requested page size (${last}) must be greater than 0.`,
      )
    }

    return {
      last,
      before,
      after,
    }
  }

  return {
    first: maxPageSize,
    after,
    before,
  }
}
