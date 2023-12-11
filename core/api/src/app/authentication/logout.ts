import { removeDeviceTokens } from "@/app/users/remove-device-tokens"
import {
  AuthWithPhonePasswordlessService,
  MissingSessionIdError,
} from "@/services/kratos"

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
