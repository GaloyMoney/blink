type GraphQLContext = {
  logger: Logger
  loaders: Record<string, any>
  domainUser: User | null
  domainAccount: Account | undefined
  geetest: GeetestType
  ip: IpAddress | undefined
}

type GraphQLContextForUser = {
  logger: Logger
  loaders: Record<string, any>
  domainUser: User
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
