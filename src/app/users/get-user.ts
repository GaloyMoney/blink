import {
  SemanticAttributes,
  asyncRunInSpan,
  addAttributesToCurrentSpan,
  ENDUSER_ALIAS,
} from "@services/tracing"
import { UsersRepository } from "@services/mongoose"
import { IpFetcher } from "@services/ipfetcher"
import { getIpConfig } from "@config/app"

const users = UsersRepository()

export const getUserForLogin = async ({
  userId,
  ip,
}: {
  userId: string
  ip?: string
}): Promise<User | ApplicationError> =>
  asyncRunInSpan(
    "app.getUserForLogin",
    { [SemanticAttributes.CODE_FUNCTION]: "getUserForLogin" },
    async () => {
      const user = await users.findById(userId as UserId)
      if (user instanceof Error) return user
      addAttributesToCurrentSpan({
        [ENDUSER_ALIAS]: user.username,
      })
      user.lastConnection = new Date()

      const updateIpInfo = async () => {
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
        await users.update(user)
        return user
      }

      return Promise.race<User>([updateIpInfo(), Promise.resolve<User>(user)])
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
