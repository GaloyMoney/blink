type GraphQLContext = {
  logger: Logger
  uid: UserId | null
  wallet: Wallet | null
  domainUser: User | null
  domainAccount: Account | undefined
  user: UserRecord | null
  geetest: GeetestType
  ip: IpAddress | undefined
}

type GraphQLContextForUser = {
  logger: Logger
  uid: UserId
  wallet: Wallet
  domainUser: User
  domainAccount: Account
  user: UserRecord
  geetest: GeetestType
  ip: IpAddress
}
