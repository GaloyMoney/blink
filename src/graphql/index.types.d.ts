type GraphQLError = import("graphql").GraphQLError
type InputValidationError = import("./error").InputValidationError

type IError = {
  message: string
  path?: string
  // TODO: add code
}

type PriceType = {
  formattedAmount: string
  base: number
  offset: number
  currencyUnit: string
}

type PricePointType = {
  timestamp: number
  price: PriceType
}

type LogFn = import("pino").LogFn

type CustomApolloError = import("./error").CustomApolloError

type CustomApolloErrorData = {
  message?: string
  logger: Logger
  level?: "fatal" | "error" | "warn" | "info" | "debug" | "trace" | "silent"
  forwardToClient?: boolean
  [key: string]: unknown
}

type GraphQLResult<T> = {
  errors: GraphQLError[]
  data: T
}

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
