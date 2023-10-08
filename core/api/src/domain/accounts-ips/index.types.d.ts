type AccountIP = {
  accountUuid: AccountUuid
  ip: IpAddress
  metadata: IPType
}

type AccountIPNew = {
  accountUuid: AccountUuid
  ip: IpAddress
  metadata?: IPType
}

type IPMetadataAuthorizerArgs = {
  denyCountries: string[]
  allowCountries: string[]
  denyASNs: string[]
  allowASNs: string[]
  checkProxy: boolean
}

type IPMetadataAuthorizer = {
  authorize(ipMetadata?: IPType): true | ValidationError
}

type FindByAccountUuidAndIpArgs = {
  accountUuid: AccountUuid
  ip: IpAddress
}

interface IAccountsIPsRepository {
  update(accountIp: AccountIP | AccountIPNew): Promise<true | RepositoryError>
  findByAccountUuidAndIp(
    input: FindByAccountUuidAndIpArgs,
  ): Promise<AccountIP | RepositoryError>
  findLastByAccountUuid(accountUuid: AccountUuid): Promise<AccountIP | RepositoryError>
}
