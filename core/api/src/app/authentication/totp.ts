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
  AuthWithPhonePasswordlessService,
  AuthWithEmailPasswordlessService,
} from "@/services/kratos"
import { kratosAdmin, kratosPublic } from "@/services/kratos/private"

import { UsersRepository } from "@/services/mongoose"

export const initiateTotpRegistration = async ({
  userId,
}: {
  userId: UserId
}): Promise<InitiateTotpRegistrationResult | KratosError> => {
  const { data } = await kratosAdmin.getIdentity({ id: userId })

  let authToken: AuthToken | null = null
  const phone = data?.traits?.phone
  const email = data?.traits?.email

  const authService = AuthWithPhonePasswordlessService()

  if (phone) {
    const kratosResult = await authService.loginToken({ phone })
    if (kratosResult instanceof Error) return kratosResult
    authToken = kratosResult.authToken
  } else if (email) {
    const emailAuthService = AuthWithEmailPasswordlessService()
    const kratosResult = await emailAuthService.loginToken({ email })
    if (kratosResult instanceof Error) return kratosResult
    authToken = kratosResult.authToken
  }

  if (!authToken) {
    return new IdentifierNotFoundError()
  }

  const initiateResponse = kratosInitiateTotp(authToken)

  const sessionResponse = await kratosPublic.toSession({ xSessionToken: authToken })
  const sessionId = sessionResponse.data.id as SessionId
  await authService.logoutToken({ sessionId })

  return initiateResponse
}

export const validateTotpRegistration = async ({
  totpCode,
  totpRegistrationId,
  userId,
}: {
  totpCode: TotpCode
  totpRegistrationId: TotpRegistrationId
  userId: UserId
}): Promise<User | ApplicationError> => {
  const { data } = await kratosAdmin.getIdentity({ id: userId })

  let authToken: AuthToken | null = null
  const phone = data?.traits?.phone
  const email = data?.traits?.email

  const authService = AuthWithPhonePasswordlessService()

  if (phone) {
    const kratosResult = await authService.loginToken({ phone })
    if (kratosResult instanceof Error) return kratosResult
    authToken = kratosResult.authToken
  } else if (email) {
    const emailAuthService = AuthWithEmailPasswordlessService()
    const kratosResult = await emailAuthService.loginToken({ email })
    if (kratosResult instanceof Error) return kratosResult
    authToken = kratosResult.authToken
  }

  if (!authToken) {
    return new IdentifierNotFoundError()
  }

  const validation = await kratosValidateTotp({ authToken, totpCode, totpRegistrationId })

  if (validation instanceof Error) return validation

  const res = await validateKratosToken(authToken)

  const sessionResponse = await kratosPublic.toSession({ xSessionToken: authToken })
  const sessionId = sessionResponse.data.id as SessionId
  await authService.logoutToken({ sessionId })

  if (res instanceof Error) return res

  if (res.kratosUserId !== userId) return new AuthTokenUserIdMismatchError()

  const me = await UsersRepository().findById(res.kratosUserId)
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
  const { data } = await kratosAdmin.getIdentity({ id: userId })

  let authToken: AuthToken | null = null
  const phone = data?.traits?.phone
  const email = data?.traits?.email

  const authService = AuthWithPhonePasswordlessService()

  if (phone) {
    const kratosResult = await authService.loginToken({ phone })
    if (kratosResult instanceof Error) return kratosResult
    authToken = kratosResult.authToken
  } else if (email) {
    const emailAuthService = AuthWithEmailPasswordlessService()
    const kratosResult = await emailAuthService.loginToken({ email })
    if (kratosResult instanceof Error) return kratosResult
    authToken = kratosResult.authToken
  }

  if (!authToken) {
    return new IdentifierNotFoundError()
  }

  const res2 = await kratosRemoveTotp(userId)

  if (res2 instanceof Error) return res2

  const sessionResponse = await kratosPublic.toSession({ xSessionToken: authToken })
  const sessionId = sessionResponse.data.id as SessionId
  await authService.logoutToken({ sessionId })

  const me = await UsersRepository().findById(userId)
  if (me instanceof Error) return me

  return me
}
