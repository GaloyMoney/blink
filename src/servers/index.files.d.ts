interface Loaders {
  /* eslint @typescript-eslint/ban-ts-comment: "off" */
  // @ts-ignore-next-line no-implicit-any
  txnMetadata
}

type GraphQLContext = {
  logger: Logger
  loaders: Loaders
  user: User | undefined
  domainAccount: Account | undefined
  geetest: GeetestType
  ip: IpAddress | undefined
}

type GraphQLContextAuth = {
  logger: Logger
  loaders: Loaders
  user: User
  domainAccount: Account
  geetest: GeetestType
  ip: IpAddress
}

// globally used types
type Logger = import("pino").Logger

declare namespace Express {
  interface Request {
    token: import("jsonwebtoken").JwtPayload
  }
}
