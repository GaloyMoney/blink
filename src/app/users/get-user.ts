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
  userId: UserId // TODO: validation
  ip: IpAddress | undefined
  logger: Logger
}): Promise<User | ApplicationError> => {
  const user = await users.findById(userId)

  if (user instanceof Error) {
    return user
  }

  // this routing run asynchrously, to update metadata on the background
  updateUserIPsInfo({ userId, ip, logger })

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
    "app.users.updateUserIPsInfo",
    {
      attributes: {
        [SemanticAttributes.CODE_FUNCTION]: "updateUserIPsInfo",
        [SemanticAttributes.CODE_NAMESPACE]: "app.users",
      },
    },
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
        let ipInfo: IPType = {
          ip,
          firstConnection: lastConnection,
          lastConnection: lastConnection,
        }

        if (ipConfig.proxyCheckingEnabled) {
          const ipFetcher = IpFetcher()
          const ipFetcherInfo = await ipFetcher.fetchIPInfo(ip)

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
