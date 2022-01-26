type GraphQLContext = {
  logger: Logger
  uid: UserId | null
  wallet: Wallet | null
  domainUser: User | null
  domainAccount: Account | null
  user: UserRecord | null
  geetest: GeetestType
  account: Account | null
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
  account: Account
  ip: IpAddress
}
