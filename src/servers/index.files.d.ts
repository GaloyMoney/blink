type GraphQLContext = {
  logger: Logger
  loaders: Record<string, any>
  user: User | undefined
  domainAccount: Account | undefined
  geetest: GeetestType
  ip: IpAddress | undefined
}

type GraphQLContextAuth = {
  logger: Logger
  loaders: Record<string, any>
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
