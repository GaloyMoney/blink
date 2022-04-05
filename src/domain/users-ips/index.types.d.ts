type UserIPs = {
  readonly id: UserId
  lastIPs: IPType[]
}

type IPMetadataValidator = {
  validateForReward(ipMetadata?: IPType): true | ApplicationError
}

interface IUsersIPsRepository {
  update(userIp: UserIPs): Promise<true | RepositoryError>
  findById(userId: UserId): Promise<UserIPs | RepositoryError>
}
