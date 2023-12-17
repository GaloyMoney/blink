import { InvalidMinutesError, InvalidPaginatedQueryArgsError } from "@/domain/errors"
export const toSeconds = (seconds: number): Seconds => {
  return seconds as Seconds
}

export const toDays = (days: number): Days => {
  return days as Days
}

export const checkedToMinutes = (minutes: number): Minutes | ValidationError => {
  const isMinutes = Number.isInteger(minutes) && minutes >= 0
  if (!isMinutes) return new InvalidMinutesError(`Invalid value for minutes: ${minutes}`)
  return minutes as Minutes
}

export const checkedToPaginatedQueryCursor = (cursor: string): PaginatedQueryCursor => {
  return cursor as PaginatedQueryCursor
}

export const checkedToPaginatedQueryArgs = ({
  paginationArgs,
  maxPageSize,
}: {
  paginationArgs: {
    first?: number
    last?: number
    before?: string
    after?: string
  }
  maxPageSize: number
}): InvalidPaginatedQueryArgsError | PaginatedQueryArgs => {
  const { first, last, before, after } = paginationArgs || {}
  if (first && last) {
    return new InvalidPaginatedQueryArgsError(`Cannot use both "first" and "last".`)
  }

  const afterCursor =
    typeof after === "string" ? checkedToPaginatedQueryCursor(after) : undefined
  const beforeCursor =
    typeof before === "string" ? checkedToPaginatedQueryCursor(before) : undefined

  if (typeof first === "number") {
    if (first > maxPageSize) {
      return new InvalidPaginatedQueryArgsError(
        `Requested page size (${first}) is greater than max allowed page size ${maxPageSize}.`,
      )
    }

    if (first <= 0) {
      return new InvalidPaginatedQueryArgsError(
        `Requested page size (${first}) must be greater than 0.`,
      )
    }

    return {
      first,
      after: afterCursor,
      before: beforeCursor,
    }
  }

  if (typeof last === "number") {
    if (last > maxPageSize) {
      return new InvalidPaginatedQueryArgsError(
        `Requested page size (${last}) is greater than max allowed page size ${maxPageSize}.`,
      )
    }

    if (last <= 0) {
      return new InvalidPaginatedQueryArgsError(
        `Requested page size (${last}) must be greater than 0.`,
      )
    }

    return {
      last,
      after: afterCursor,
      before: beforeCursor,
    }
  }

  return {
    first: maxPageSize,
    after: afterCursor,
    before: beforeCursor,
  }
}
