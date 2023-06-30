type AccountIP = {
  accountId: AccountId
  ip: IpAddress
  metadata: IPType
}

type AccountIPNew = {
  accountId: AccountId
  ip: IpAddress
  metadata?: IPType
}

type IPMetadataValidatorArgs = {
  denyIPCountries: string[]
  allowIPCountries: string[]
  denyASNs: string[]
  allowASNs: string[]
}

type IPMetadataValidator = {
  validateForReward(ipMetadata?: IPType): true | ValidationError
}

type FindByAccountIdAndIpInput = {
  accountId: AccountId
  ip: IpAddress
}

interface IAccountsIPsRepository {
  update(accountIp: AccountIP | AccountIPNew): Promise<true | RepositoryError>
  findByAccountIdAndIp(
    input: FindByAccountIdAndIpInput,
  ): Promise<AccountIP | RepositoryError>
  lastByAccountId(accountId: AccountId): Promise<AccountIP | RepositoryError>
}
