import { getIpConfig } from "@config"
import { RepositoryError } from "@domain/errors"
import { IpFetcherServiceError } from "@domain/ipfetcher"
import { IpFetcher } from "@services/ipfetcher"
import { UsersRepository } from "@services/mongoose"
import { UsersIpRepository } from "@services/mongoose/users-ips"
import { asyncRunInSpan, SemanticAttributes } from "@services/tracing"

const users = UsersRepository()
const usersIp = UsersIpRepository()

export const getUserForLogin = async ({
  userId,
  ip,
  logger,
}: {
  userId: string
  ip: IpAddress | undefined
  logger: Logger
}): Promise<User | ApplicationError> => {
  const user = await users.findById(userId as UserId)

  if (user instanceof Error) {
    return user
  }

  // this routing run asynchrously, to update metadata on the background
  updateUserIPsInfo({ userId, ip, logger } as {
    userId: UserId
    ip: IpAddress
    logger: Logger
  })

  return user
}

const updateUserIPsInfo = async ({
  userId,
  ip,
  logger,
}: {
  userId: UserId
  ip?: IpAddress
  logger: Logger
}): Promise<void | RepositoryError> =>
  asyncRunInSpan(
    "app.updateUserIPsInfo",
    { [SemanticAttributes.CODE_FUNCTION]: "app.updateUserIPsInfo" },
    async () => {
      const ipConfig = getIpConfig()

      const lastConnection = new Date()

      const userIP = await usersIp.findById(userId)
      if (userIP instanceof RepositoryError) return userIP

      if (!ip || !ipConfig.ipRecordingEnabled) {
        const result = await usersIp.update(userIP)

        if (result instanceof Error) {
          logger.error(
            { result, userId, ip },
            "impossible to update user last connection",
          )

          return result
        }

        return
      }

      const lastIP = userIP.lastIPs.find((ipObject) => ipObject.ip === ip)

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

          if (ipFetcherInfo instanceof IpFetcherServiceError) {
            logger.error({ userId, ip }, "impossible to get ip detail")
            return ipFetcherInfo
          }

          ipInfo = { ...ipInfo, ...ipFetcherInfo }
        }
        userIP.lastIPs.push(ipInfo)
      }
      const result = await usersIp.update(userIP)

      if (result instanceof Error) {
        logger.error({ result, userId, ip }, "impossible to update ip")
        return result
      }
    },
  )
