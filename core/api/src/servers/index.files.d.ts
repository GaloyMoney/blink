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
}

type GraphQLPublicContextAuth = GraphQLPublicContext & {
  user: User
  domainAccount: Account
  scope: ScopesOauth2[] | undefined
  appId: string | undefined
}

type GraphQLAdminContext = {
  logger: Logger
  loaders: Loaders
  privilegedClientId: PrivilegedClientId
}

type GraphQLContext =
  | GraphQLPublicContext
  | GraphQLPublicContextAuth
  | GraphQLAdminContext

// globally used types
type Logger = import("pino").Logger

declare namespace Express {
  interface Request {
    token: import("jsonwebtoken").JwtPayload
    gqlContext: GraphQLContext
  }
}
