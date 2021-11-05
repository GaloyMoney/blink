import { SemanticAttributes, asyncRunInSpan } from "@services/tracing"
import { UsersRepository } from "@services/mongoose"
import { getIpConfig } from "@config/app"
import { IpFetcher } from "@services/ipfetcher"

const users = UsersRepository()

export const getUserForLogin = async ({
  userId,
  ip,
}: {
  userId: UserId
  ip?: Ip
}): Promise<User | ApplicationError> =>
  asyncRunInSpan(
    "app.getUserForLogin",
    { [SemanticAttributes.CODE_FUNCTION]: "addIp" },
    async () => {
      const lastConnection = new Date()

      const user = await users.findByIdAndUpdateLastConnectionDate(userId, lastConnection)

      if (user instanceof Error) {
        return user
      }

      updateIpInfo({ userId, iPs: user.lastIPs, ip, lastConnection })

      return user
    },
  )

const updateIpInfo = async ({
  userId,
  iPs,
  ip,
  lastConnection,
}: {
  userId: UserId
  iPs: IPType[]
  ip?: Ip
  lastConnection: Date
}): Promise<void> =>
  asyncRunInSpan(
    "app.getUserForLogin",
    { [SemanticAttributes.CODE_FUNCTION]: "addIp" },
    async () => {
      const ipConfig = getIpConfig()

      if (!ip || !ipConfig.ipRecordingEnabled) {
        return
      }

      const lastIP = iPs.find((ipObject) => ipObject.ip === ip)

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
        iPs.push(ipInfo)
      }
      users.updateIps(userId, iPs)
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
