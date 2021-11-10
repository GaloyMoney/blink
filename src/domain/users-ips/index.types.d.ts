type UserIPs = {
  readonly id: UserId
  lastIPs: IPType[]
}

interface IUsersIPsRepository {
  update(userIp: UserIPs): Promise<true | RepositoryError>
  findById(userId: UserId): Promise<UserIPs | RepositoryError>
}
