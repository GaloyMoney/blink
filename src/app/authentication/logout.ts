import { AuthWithPhonePasswordlessService } from "@services/kratos"

export const logoutToken = async (
  token: AuthToken,
): Promise<boolean | ApplicationError> => {
  const authService = AuthWithPhonePasswordlessService()
  const kratosResult = await authService.logoutToken({ token })
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
