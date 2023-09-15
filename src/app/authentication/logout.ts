import { AuthWithPhonePasswordlessService, MissingSessionIdError } from "@services/kratos"

export const logoutToken = async (
  sessionId: SessionId | undefined,
): Promise<boolean | ApplicationError> => {
  if (!sessionId) return new MissingSessionIdError()

  const authService = AuthWithPhonePasswordlessService()
  const kratosResult = await authService.logoutToken({ sessionId })
  if (kratosResult instanceof Error) {
    return kratosResult
  }
  return true
}

export const logoutCookie = async (
  cookie: SessionCookie,
): Promise<boolean | ApplicationError> => {
  const authService = AuthWithPhonePasswordlessService()
  const kratosResult = await authService.logoutCookie({ cookie })
  if (kratosResult instanceof Error) {
    return kratosResult
  }
  return true
}
