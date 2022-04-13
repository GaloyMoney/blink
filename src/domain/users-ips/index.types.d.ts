type UserIPs = {
  readonly id: UserId
  lastIPs: IPType[]
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

interface IUsersIPsRepository {
  update(userIp: UserIPs): Promise<true | RepositoryError>
  findById(userId: UserId): Promise<UserIPs | RepositoryError>
}
