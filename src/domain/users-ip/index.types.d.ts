type UserIp = {
  readonly id: UserId
  lastIPs: IPType[]
}

interface IUsersIpRepository {
  update(
    userId: UserId,
    lastConnection: Date,
    lastIPs?: IPType[],
  ): Promise<true | RepositoryError>
  findById(userId: UserId): Promise<UserIp | RepositoryError>
}

type Ip = string
