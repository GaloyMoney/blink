type GraphQLContext = {
  logger: Logger
  kratosUser: IdentityPhone | undefined
  domainAccount: Account | undefined
  geetest: GeetestType
  ip: IpAddress | undefined
}

type GraphQLContextAuth = {
  logger: Logger
  kratosUser: IdentityPhone
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
