import { removeDeviceTokens } from "@/app/users/remove-device-tokens"
import {
  AuthWithPhonePasswordlessService,
  MissingSessionIdError,
} from "@/services/kratos"
import { kratosPublic } from "@/services/kratos/private"

export const logoutToken = async ({
  userId,
  deviceToken,
  sessionId,
}: {
  userId: UserId
  deviceToken: DeviceToken | undefined
  sessionId: SessionId | undefined
}): Promise<boolean | ApplicationError> => {
  if (!sessionId) return new MissingSessionIdError()

  const authService = AuthWithPhonePasswordlessService()
  const kratosResult = await authService.logoutToken({ sessionId })
  if (kratosResult instanceof Error) {
    return kratosResult
  }

  if (deviceToken) {
    await removeDeviceTokens({ userId, deviceTokens: [deviceToken] })
  }

  return true
}

export const logoutSessionByAuthToken = async (authToken: AuthToken) => {
  const authService = AuthWithPhonePasswordlessService()
  const sessionResponse = await kratosPublic.toSession({ xSessionToken: authToken })
  const sessionId = sessionResponse.data.id as SessionId
  await authService.logoutToken({ sessionId })
}
