import { SemanticAttributes, asyncRunInSpan } from "@services/tracing"
import { UsersRepository } from "@services/mongoose"
import { getIpConfig } from "@config/app"
import { IpFetcher } from "@services/ipfetcher"
import { UsersIpRepository } from "@services/mongoose/users-ip"
import { RepositoryError } from "@domain/errors"

const users = UsersRepository()
const usersIp = UsersIpRepository()

export const getUserForLogin = async ({
  userId,
  ip,
  logger,
}: {
  userId: UserId
  ip?: Ip
  logger: Logger
}): Promise<User | ApplicationError> =>
  asyncRunInSpan(
    "app.getUserForLogin",
    { [SemanticAttributes.CODE_FUNCTION]: "getUserForLogin" },
    async () => {
      const user = await users.findById(userId)

      if (user instanceof Error) {
        return user
      }

      // this routing run asynchrously, to update metadata on the background
      updateUserIpInfo({ userId, ip, logger })

      return user
    },
  )

const updateUserIpInfo = async ({
  userId,
  ip,
  logger,
}: {
  userId: UserId
  ip?: Ip
  logger: Logger
}): Promise<void> =>
  asyncRunInSpan(
    "app.addIp",
    { [SemanticAttributes.CODE_FUNCTION]: "addIp" },
    async () => {
      const ipConfig = getIpConfig()

      const lastConnection = new Date()

      const userIp = await usersIp.findById(userId)

      if (userIp instanceof RepositoryError) throw userIp

      if (!ip || !ipConfig.ipRecordingEnabled) {
        const result = await usersIp.update(userId, lastConnection)

        if (result instanceof Error) {
          logger.error(
            { result, userId, ip },
            "impossible to update user last connection",
          )
        }

        return
      }

      const lastIP = userIp.lastIPs.find((ipObject) => ipObject.ip === ip)

      if (lastIP) {
        lastIP.lastConnection = lastConnection
      } else {
        let ipInfo = {
          ip,
          firstConnection: lastConnection,
          lastConnection: lastConnection,
        } as IPType

        if (ipConfig.proxyCheckingEnabled) {
          const ipFetcher = IpFetcher()
          const ipFetcherInfo = await ipFetcher.fetchIPInfo(ip as IpAddress)

          if (!(ipFetcherInfo instanceof Error)) {
            ipInfo = { ...ipInfo, ...ipFetcherInfo }
          }
        }
        userIp.lastIPs.push(ipInfo)
      }
      const result = await usersIp.update(userId, lastConnection, userIp.lastIPs)

      if (result instanceof Error) {
        logger.error({ result, userId, ip }, "impossible to update ip")
      }
    },
  )

export const getUsernameFromWalletPublicId = async (
  walletPublicId: WalletPublicId,
): Promise<Username | Error> => {
  const user = await users.findByWalletPublicId(walletPublicId)

  if (user instanceof Error) return user

  return user.username
}

export const getWalletPublicIdFromUsername = async (
  username: Username,
): Promise<WalletPublicId | Error> => {
  const user = await users.findByUsername(username)

  if (user instanceof Error) return user

  return user.walletPublicId
}
