import { getIpConfig } from "@/config"
import { isPrivateIp } from "@/domain/accounts-ips"
import { CouldNotFindAccountIpError, RepositoryError } from "@/domain/errors"
import { IpFetcherServiceError } from "@/domain/ipfetcher"
import { ErrorLevel } from "@/domain/shared"
import { IpFetcher } from "@/services/ipfetcher"
import { AccountsIpsRepository } from "@/services/mongoose/accounts-ips"
import {
  addAttributesToCurrentSpan,
  recordExceptionInCurrentSpan,
} from "@/services/tracing"

const accountsIps = AccountsIpsRepository()

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

  if (!ipConfig.ipRecordingEnabled) {
    return
  }

  let newAccountIP: AccountIPNew | undefined

  const existingAccountIP = await accountsIps.findByAccountIdAndIp({ accountId, ip })
  if (existingAccountIP instanceof CouldNotFindAccountIpError) {
    newAccountIP = {
      accountId,
      ip,
      metadata: undefined,
    }
  } else if (existingAccountIP instanceof RepositoryError) return existingAccountIP

  const accountIP = (newAccountIP || existingAccountIP) as AccountIP | AccountIPNew

  if (ipConfig.proxyCheckingEnabled && accountIP.metadata === undefined) {
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

    // deep copy for opentelemetry
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
      accountIP.metadata = ipFetcherInfo
    }
  }
  const result = await accountsIps.update(accountIP)

  if (result instanceof Error) {
    logger.error({ result, accountId, ip }, "impossible to update ip")
    return result
  }
}
