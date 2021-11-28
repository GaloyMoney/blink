import {
  SemanticAttributes,
  asyncRunInSpan,
  addAttributesToCurrentSpan,
  ENDUSER_ALIAS,
} from "@services/tracing"
import { UsersRepository } from "@services/mongoose"
import { getIpConfig, getTestAccounts } from "@config/app"
import { IpFetcher } from "@services/ipfetcher"
import { UsersIpRepository } from "@services/mongoose/users-ips"
import { RepositoryError } from "@domain/errors"
import { IpFetcherServiceError } from "@domain/ipfetcher"
import { checkedToPhoneNumber } from "@domain/users"

const users = UsersRepository()
const usersIp = UsersIpRepository()

export const getUserForLogin = async ({
  userId,
  ip,
  logger,
}: {
  userId: string
  ip?: string
  logger: Logger
}): Promise<User | ApplicationError> =>
  asyncRunInSpan(
    "app.getUserForLogin",
    { [SemanticAttributes.CODE_FUNCTION]: "getUserForLogin" },
    async () => {
      const user = await users.findById(userId as UserId)

      if (user instanceof Error) {
        return user
      }
      addAttributesToCurrentSpan({
        [ENDUSER_ALIAS]: user.username,
      })
      // this routing run asynchrously, to update metadata on the background
      updateUserIPsInfo({ userId, ip, logger } as {
        userId: UserId
        ip: IpAddress
        logger: Logger
      })

      return user
    },
  )

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

export const getUsernameFromWalletPublicId = async (
  walletPublicId: WalletPublicId,
): Promise<Username | Error> => {
  const user = await users.findByWalletPublicId(walletPublicId)

  if (user instanceof Error) return user

  return user.username
}

export const isTestAccountPhone = (phone: PhoneNumber) => {
  const phoneNumberValid = checkedToPhoneNumber(phone)
  if (phoneNumberValid instanceof Error) return phoneNumberValid

  return getTestAccounts().findIndex((item) => item.phone === phone) !== -1
}

export const isTestAccountPhoneAndCode = ({
  code,
  phone,
}: {
  code: PhoneCode
  phone: PhoneNumber
}) => {
  const phoneNumberValid = checkedToPhoneNumber(phone)
  if (phoneNumberValid instanceof Error) return phoneNumberValid

  return (
    getTestAccounts().findIndex((item) => item.phone === phone) !== -1 &&
    getTestAccounts()
      .filter((item) => item.phone === phone)[0]
      .code.toString() === code.toString()
  )
}
