type DisplayCurrencyPerSat = number & { readonly brand: unique symbol }
type DisplayCurrencyBasePerSat = number & { readonly brand: unique symbol }
type Username = string & { readonly brand: unique symbol }
type UsernameWithFlags = string & { readonly brand: unique symbol }
type Pubkey = string & { readonly brand: unique symbol }
type WalletId = string & { readonly brand: unique symbol }
type AccountId = string & { readonly brand: unique symbol }
type Seconds = number & { readonly brand: unique symbol }
type Minutes = number & { readonly brand: unique symbol }
type MilliSeconds = number & { readonly brand: unique symbol }
type Days = number & { readonly brand: unique symbol }
type JwtToken = string & { readonly brand: unique symbol } // short lived asymmetric token from oathkeeper
type Memo = string & { readonly brand: unique symbol }
type NotificationCategory = string & { readonly brand: unique symbol }

type XOR<T1, T2> =
  | (T1 & { [k in Exclude<keyof T2, keyof T1>]?: never })
  | (T2 & { [k in Exclude<keyof T1, keyof T2>]?: never })

type JSONValue =
  | string
  | number
  | bigint
  | boolean
  | Date
  | JSONObject
  | JSONArray
  | null
  | undefined
type JSONArray = Array<JSONValue>
type JSONObject = { [key: string]: JSONValue }

type PaginatedQueryCursor = string & { readonly brand: unique symbol }
type PaginatedQueryArgs =
  | {
      first: number
      last?: undefined
      after?: PaginatedQueryCursor
      before?: PaginatedQueryCursor
    }
  | {
      first?: undefined
      last: number
      before?: PaginatedQueryCursor
      after?: PaginatedQueryCursor
    }
type PaginatedQueryResult<T> = {
  edges: {
    node: T
    cursor: PaginatedQueryCursor
  }[]
  pageInfo: {
    startCursor?: PaginatedQueryCursor
    endCursor?: PaginatedQueryCursor
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}
