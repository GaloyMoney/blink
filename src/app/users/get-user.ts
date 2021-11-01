import { SemanticAttributes, asyncRunInSpan } from "@services/tracing"
import { UsersRepository } from "@services/mongoose"
import { IpFetcher } from "@services/ipfetcher"
import { getIpConfig } from "@config/app"
import { RepositoryError } from "@domain/errors"

const users = UsersRepository()

export const getUserForLogin = async ({
  userId,
  ip,
}: {
  userId: string
  ip?: string
}): Promise<User | ApplicationError> => {
  return asyncRunInSpan(
    "app.getUserForLogin",
    {
      [SemanticAttributes.ENDUSER_ID]: userId,
      [SemanticAttributes.CODE_FUNCTION]: "getUserForLogin",
      [SemanticAttributes.HTTP_CLIENT_IP]: ip,
    },
    async () => {
      const user = await users.findById(userId as UserId)
      if (user instanceof Error) {
        return user
      }
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

      const updateResult = await users.update(user)

      if (updateResult instanceof RepositoryError) {
        return updateResult
      }
      return user
    },
  )
}

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
