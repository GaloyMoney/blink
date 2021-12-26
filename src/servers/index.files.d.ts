type GraphQLContext = {
  logger: Logger
  uid: UserId | null
  wallet: Wallet | null
  domainUser: User | null
  domainAccount: Account | null
  user: User | null
  geetest: GeetestType
  account: Account | null
  ip: string | undefined
}
