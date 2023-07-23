declare class DataLoader<K, V> {
  load(key: K): Promise<V>
}

interface Loaders {
  txnMetadata: DataLoader<string, LedgerTransactionMetadata | undefined | RepositoryError>
}

type GraphQLPublicContext = {
  logger: Logger
  loaders: Loaders
  ip: IpAddress | undefined
  sessionId: SessionId | undefined
  scope: ScopesOauth2[] | undefined // should only be undefined
  user: undefined | User // should only be undefined
  domainAccount: undefined | Account // should only be undefined
  appId: string | undefined
}

type GraphQLPublicContextAuth = Omit<
  GraphQLPublicContext,
  "scope" | "user" | "domainAccount"
> & {
  user: User
  domainAccount: Account
  scope: ScopesOauth2[] | undefined
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
    gqlContext: GraphQLPublicContext | GraphQLPublicContextAuth | GraphQLAdminContext
  }
}
