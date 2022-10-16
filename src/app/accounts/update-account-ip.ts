import { getIpConfig } from "@config"
import { RepositoryError } from "@domain/errors"
import { IpFetcherServiceError } from "@domain/ipfetcher"
import { IpFetcher } from "@services/ipfetcher"
import { AccountsIpRepository } from "@services/mongoose/accounts-ips"
import { asyncRunInSpan, SemanticAttributes } from "@services/tracing"

const accountsIp = AccountsIpRepository()

export const updateAccountIPsInfo = async ({
  accountId,
  ip,
  logger,
}: {
  accountId: AccountId
  ip?: IpAddress
  logger: Logger
}): Promise<void | RepositoryError> =>
  asyncRunInSpan(
    "app.users.updateAccountIPsInfo",
    {
      attributes: {
        [SemanticAttributes.CODE_FUNCTION]: "updateAccountIPsInfo",
        [SemanticAttributes.CODE_NAMESPACE]: "app.users",
      },
    },
    async () => {
      const ipConfig = getIpConfig()

      const lastConnection = new Date()

      const userIP = await accountsIp.findById(accountId)
      if (userIP instanceof RepositoryError) return userIP

      if (!ip || !ipConfig.ipRecordingEnabled) {
        const result = await accountsIp.update(userIP)

        if (result instanceof Error) {
          logger.error(
            { result, accountId, ip },
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
            logger.error({ accountId, ip }, "impossible to get ip detail")
            return ipFetcherInfo
          }

          ipInfo = { ...ipInfo, ...ipFetcherInfo }
        }
        userIP.lastIPs.push(ipInfo)
      }
      const result = await accountsIp.update(userIP)

      if (result instanceof Error) {
        logger.error({ result, accountId, ip }, "impossible to update ip")
        return result
      }
    },
  )
