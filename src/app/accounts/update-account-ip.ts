import { getIpConfig } from "@config"
import { isPrivateIp } from "@domain/accounts-ips"
import { RepositoryError } from "@domain/errors"
import { IpFetcherServiceError } from "@domain/ipfetcher"
import { ErrorLevel } from "@domain/shared"
import { IpFetcher } from "@services/ipfetcher"
import { AccountsIpRepository } from "@services/mongoose/accounts-ips"
import {
  addAttributesToCurrentSpan,
  recordExceptionInCurrentSpan,
} from "@services/tracing"

const accountsIp = AccountsIpRepository()

export const updateAccountIPsInfo = async ({
  accountId,
  ip,
  logger,
}: {
  accountId: AccountId
  ip?: IpAddress
  logger: Logger
}): Promise<void | RepositoryError> => {
  const ipConfig = getIpConfig()

  if (!ip) {
    logger.warn(`no ip address`)
    return
  }

  if (isPrivateIp(ip)) {
    return
  }

  const lastConnection = new Date()

  const accountIPs = await accountsIp.findById(accountId)
  if (accountIPs instanceof RepositoryError) return accountIPs

  if (!ipConfig.ipRecordingEnabled) {
    // just updating last connection
    const result = await accountsIp.update({ id: accountIPs.id })

    if (result instanceof Error) {
      logger.error(
        { result, accountId, ip },
        "impossible to update account last connection",
      )

      return result
    }

    return
  }

  let ipInfo: IPType

  const ipFromDb = accountIPs.lastIPs.find((ipObject) => ipObject.ip === ip)

  if (ipFromDb) {
    ipInfo = ipFromDb
    ipInfo.lastConnection = lastConnection
  } else {
    ipInfo = {
      ip,
      firstConnection: lastConnection,
      lastConnection: lastConnection,
    }
  }

  if (
    ipConfig.proxyCheckingEnabled &&
    (!ipInfo.isoCode || ipInfo.proxy === undefined || !ipInfo.asn)
  ) {
    const ipFetcher = IpFetcher()
    const ipFetcherInfo = await ipFetcher.fetchIPInfo(ip)

    if (ipFetcherInfo instanceof IpFetcherServiceError) {
      recordExceptionInCurrentSpan({
        error: ipFetcherInfo,
        level: ErrorLevel.Warn,
        attributes: {
          ip,
          accountId,
        },
      })

      logger.error({ accountId, ip }, "impossible to get ip detail")
      return ipFetcherInfo
    }

    // deep copy
    const ipFetcherInfoForOtel = JSON.parse(JSON.stringify(ipFetcherInfo))

    for (const key in ipFetcherInfoForOtel) {
      ipFetcherInfoForOtel["proxycheck." + key] = ipFetcherInfoForOtel[key]
      delete ipFetcherInfoForOtel[key]
    }

    addAttributesToCurrentSpan(ipFetcherInfoForOtel)

    if (
      !ipFetcherInfo.isoCode ||
      ipFetcherInfo.proxy === undefined ||
      !ipFetcherInfo.asn
    ) {
      const errorMsg = `missing mandatory fields. isoCode: ${ipFetcherInfo.isoCode}, proxy: ${ipFetcherInfo.proxy}, asn: ${ipFetcherInfo.asn}`
      recordExceptionInCurrentSpan({
        error: new IpFetcherServiceError(errorMsg),
        level: ErrorLevel.Warn,
        attributes: {
          ip,
          accountId,
        },
      })
    } else {
      // using Object.assign instead of ... because of conflict with mongoose hidden properties
      ipInfo = Object.assign(ipInfo, ipFetcherInfo)

      // removing current ip from lastIPs - if it exists
      accountIPs.lastIPs = accountIPs.lastIPs.filter((ipDb) => ipDb.ip !== ip)

      // adding it back with the correct info
      accountIPs.lastIPs.push(ipInfo)
    }
  }
  const result = await accountsIp.update(accountIPs)

  if (result instanceof Error) {
    logger.error({ result, accountId, ip }, "impossible to update ip")
    return result
  }
}
