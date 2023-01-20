import { AuthWithPhonePasswordlessService } from "@services/kratos"

export const logout = async (
  authToken: SessionToken,
): Promise<boolean | ApplicationError> => {
  const authService = AuthWithPhonePasswordlessService()
  const kratosResult = await authService.logout(authToken)
  if (kratosResult instanceof Error) {
    return kratosResult
  }
  return true
}
