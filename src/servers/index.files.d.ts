type GraphQLContext = {
  logger: Logger
  uid: UserId | null
  domainUser: User | null
  domainAccount: Account | undefined
  geetest: GeetestType
  ip: IpAddress | undefined
}

type GraphQLContextForUser = {
  logger: Logger
  uid: UserId
  domainUser: User
  domainAccount: Account
  geetest: GeetestType
  ip: IpAddress
}
