declare class DataLoader<K, V> {
  load(key: K): Promise<V>
}

interface Loaders {
  txnMetadata: DataLoader<string, LedgerTransactionMetadata | undefined | RepositoryError>
}

type GraphQLPublicContext = {
  logger: Logger
  loaders: Loaders
  user: User | undefined
  domainAccount: Account | undefined
  ip: IpAddress | undefined
}

type GraphQLPublicContextAuth = Omit<GraphQLPublicContext, "user" | "domainAccount"> & {
  user: User
  domainAccount: Account
}

type GraphQLAdminContext = {
  logger: Logger
  loaders: Loaders
  auditorId: UserId
  isEditor: boolean
  ip: IpAddress
}

// globally used types
type Logger = import("pino").Logger

declare namespace Express {
  interface Request {
    token: import("jsonwebtoken").JwtPayload
    gqlContext: GraphQLPublicContext | GraphQLAdminContext
  }
}
