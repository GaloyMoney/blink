import { UsersRepository, WalletsRepository } from "@services/mongoose"
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
  walletName: WalletName
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

export const addNewWalletContact = async ({
  userId,
  contactWalletId,
}: {
  userId: UserId
  contactWalletId: WalletId
}): Promise<User | ApplicationError> => {
  const contactWallet = await WalletsRepository().findById(contactWalletId)
  if (contactWallet instanceof Error) return contactWallet
  const { walletName } = contactWallet
  if (!walletName)
    return new ValidationError(
      "New wallet contact does not have a value for 'walletName' property",
    )

  const usersRepo = UsersRepository()
  const user = await usersRepo.findById(userId)
  if (user instanceof Error) return user

  const found = user.contacts.find(
    (walletContact) => walletContact.walletName === walletName,
  )
  if (found) return user

  user.contacts.push({
    walletName,
    alias: "" as ContactAlias,
    transactionsCount: 1,
  })
  const updateResult = await usersRepo.update(user)
  if (updateResult instanceof Error) return updateResult

  return user
}

export const getUserForLogin = async ({
  userId,
  ip,
}: {
  userId: string
  ip?: string
}): Promise<User | ApplicationError> => {
  const repo = UsersRepository()

  const user = await repo.findById(userId as UserId)
  if (user instanceof Error) return user
  user.lastConnection = new Date()

  // IP tracking logic could be extracted into domain
  const ipConfig = getIpConfig()
  if (ip && ipConfig.ipRecordingEnabled) {
    const lastIP: IPType | undefined = user.lastIPs.find(
      (ipObject: IPType) => ipObject.ip === ip,
    )
    if (lastIP) {
      lastIP.lastConnection = user.lastConnection
    } else if (ipConfig.proxyCheckingEnabled) {
      const ipFetcher = IpFetcher()
      const ipInfo = await ipFetcher.fetchIPInfo(ip as IpAddress)
      if (!(ipInfo instanceof Error)) {
        user.lastIPs.push({
          ip,
          ...ipInfo,
          Type: ipInfo.type,
          firstConnection: user.lastConnection,
          lastConnection: user.lastConnection,
        })
      }
    }
  }

  const updateResult = await repo.update(user)

  if (updateResult instanceof RepositoryError) {
    return updateResult
  }

  return user
}
