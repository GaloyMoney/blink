import { UsersRepository } from "@services/mongoose"
import { IpFetcher } from "@services/ipfetcher"
import { getIpConfig } from "@config/app"
import { ValidationError, RepositoryError } from "@domain/errors"

export const getUser = async (userId: UserId): Promise<User | ApplicationError> => {
  const repo = UsersRepository()
  return repo.findById(userId)
}

export const updateWalletContactAlias = async ({
  userId,
  walletName,
  alias,
}: {
  userId: UserId
  walletName: string
  alias: string
}): Promise<User | ApplicationError> => {
  const repo = UsersRepository()
  const user = await repo.findById(userId)
  if (user instanceof Error) {
    return user
  }

  const found = user.contacts.find(
    (walletContact) => walletContact.walletName === walletName,
  )
  if (!found) {
    return new ValidationError("User doesn't have walletContact")
  }
  found.alias = alias as ContactAlias

  const result = await repo.update(user)
  if (result instanceof Error) {
    return result
  }

  return user
}

export const getUserForLogin = async ({
  userId,
  ip,
}: {
  userId: string
  ip?: string
}): Promise<{ domainUser: User; rawUser: UserType } | ApplicationError> => {
  const repo = UsersRepository()

  const findResult = await repo.findByIdIncludeRaw(userId as UserId)
  if (findResult instanceof Error) return findResult

  const { domainUser, raw } = findResult
  domainUser.lastConnection = new Date()

  // IP tracking logic could be extracted into domain
  const ipConfig = getIpConfig()
  if (ipConfig.ipRecordingEnabled) {
    const lastIP: IPType | undefined = domainUser.lastIPs.find(
      (ipObject: IPType) => ipObject.ip === ip,
    )
    if (lastIP) {
      lastIP.lastConnection = domainUser.lastConnection
    } else if (ip && ipConfig.proxyCheckingEnabled) {
      const ipFetcher = IpFetcher()
      const ipInfo = await ipFetcher.fetchIPInfo(ip)
      if (!(ipInfo instanceof Error)) {
        domainUser.lastIPs.push({
          ip,
          ...ipInfo,
          Type: ipInfo.type,
          firstConnection: domainUser.lastConnection,
          lastConnection: domainUser.lastConnection,
        })
      }
    }
  }

  const updateResult = await repo.update(domainUser)

  if (updateResult instanceof RepositoryError) {
    return updateResult
  }

  return { domainUser, rawUser: raw }
}
