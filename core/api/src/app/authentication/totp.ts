import {
  AuthTokenUserIdMismatchError,
  IdentifierNotFoundError,
} from "@/domain/authentication/errors"
import {
  validateKratosToken,
  kratosValidateTotp,
  kratosInitiateTotp,
  kratosElevatingSessionWithTotp,
  kratosRemoveTotp,
  logoutSessionByAuthToken,
  refreshToken,
  AuthWithPhonePasswordlessService,
  AuthWithEmailPasswordlessService,
} from "@/services/kratos"
import { kratosAdmin } from "@/services/kratos/private"

import { UsersRepository } from "@/services/mongoose"

export const initiateTotpRegistration = async ({
  userId,
}: {
  userId: UserId
}): Promise<InitiateTotpRegistrationResult | KratosError> => {
  const authToken = await getAuthTokenFromUserId(userId)
  if (authToken instanceof Error) {
    return authToken
  }
  const initiateResponse = kratosInitiateTotp(authToken)
  await logoutSessionByAuthToken(authToken)
  return initiateResponse
}

export const validateTotpRegistration = async ({
  authToken,
  totpCode,
  totpRegistrationId,
  userId,
}: {
  authToken: AuthToken | null
  totpCode: TotpCode
  totpRegistrationId: TotpRegistrationId
  userId: UserId
}): Promise<User | ApplicationError> => {
  if (authToken) {
    return validateTotpRegistrationWithToken({
      authToken,
      totpCode,
      totpRegistrationId,
      userId,
    })
  }

  return validateTotpRegistrationWithoutToken({
    totpCode,
    totpRegistrationId,
    userId,
  })
}

const validateTotpRegistrationWithoutToken = async ({
  totpCode,
  totpRegistrationId,
  userId,
}: {
  totpCode: TotpCode
  totpRegistrationId: TotpRegistrationId
  userId: UserId
}): Promise<User | ApplicationError> => {
  const authToken = await getAuthTokenFromUserId(userId)
  if (authToken instanceof Error) {
    return authToken
  }
  const validation = await kratosValidateTotp({ authToken, totpCode, totpRegistrationId })
  if (validation instanceof Error) return validation

  const res = await validateKratosToken(authToken)
  await logoutSessionByAuthToken(authToken)
  if (res instanceof Error) return res
  if (res.kratosUserId !== userId) return new AuthTokenUserIdMismatchError()

  const me = await UsersRepository().findById(res.kratosUserId)
  if (me instanceof Error) return me

  return me
}

const validateTotpRegistrationWithToken = async ({
  authToken,
  totpCode,
  totpRegistrationId,
  userId,
}: {
  authToken: AuthToken
  totpCode: TotpCode
  totpRegistrationId: TotpRegistrationId
  userId: UserId
}): Promise<User | ApplicationError> => {
  const res = await refreshToken(authToken)
  if (res instanceof Error) return res

  const validation = await kratosValidateTotp({ authToken, totpCode, totpRegistrationId })
  if (validation instanceof Error) return validation

  const res2 = await validateKratosToken(authToken)
  if (res2 instanceof Error) return res2
  if (res2.kratosUserId !== userId) return new AuthTokenUserIdMismatchError()

  const me = await UsersRepository().findById(res2.kratosUserId)
  if (me instanceof Error) return me

  return me
}

export const elevatingSessionWithTotp = async ({
  authToken,
  totpCode,
}: {
  authToken: AuthToken
  totpCode: TotpCode
}): Promise<boolean | KratosError> => {
  return kratosElevatingSessionWithTotp({ authToken, totpCode })
}

export const removeTotp = async ({
  userId,
}: {
  userId: UserId
}): Promise<User | ApplicationError> => {
  const authToken = await getAuthTokenFromUserId(userId)
  if (authToken instanceof Error) {
    return authToken
  }

  const res2 = await kratosRemoveTotp(userId)
  if (res2 instanceof Error) return res2

  await logoutSessionByAuthToken(authToken)

  const me = await UsersRepository().findById(userId)
  if (me instanceof Error) return me

  return me
}

const getAuthTokenFromUserId = async (
  userId: UserId,
): Promise<AuthToken | AuthenticationError> => {
  const { data } = await kratosAdmin.getIdentity({ id: userId })
  let kratosResult:
    | IAuthWithEmailPasswordlessService
    | LoginWithPhoneNoPasswordSchemaResponse
    | KratosError
    | null = null

  const phone = data?.traits?.phone
  const email = data?.traits?.email

  if (phone) {
    const authService = AuthWithPhonePasswordlessService()
    kratosResult = await authService.loginToken({ phone })
  } else if (email) {
    const emailAuthService = AuthWithEmailPasswordlessService()
    kratosResult = await emailAuthService.loginToken({ email })
  } else {
    return new IdentifierNotFoundError()
  }

  if (kratosResult instanceof Error) {
    return kratosResult
  }

  return kratosResult?.authToken
}
