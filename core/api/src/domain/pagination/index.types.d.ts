type PaginatedResult<T> = import("graphql-relay").Connection<T>

type PaginationArgs = import("graphql-relay").ConnectionArguments

type ConnectionCursor = import("graphql-relay").ConnectionCursor

type ParsedPaginationArgs =
  | {
      first: number
      last?: undefined
      after?: ConnectionCursor | null
      before?: ConnectionCursor | null
    }
  | {
      first?: undefined
      last: number
      before?: ConnectionCursor | null
      after?: ConnectionCursor | null
    }
