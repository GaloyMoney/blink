import { AuthTokenUserIdMismatchError } from "@/domain/authentication/errors"
import {
  validateKratosToken,
  kratosValidateTotp,
  kratosInitiateTotp,
  kratosElevatingSessionWithTotp,
  kratosRemoveTotp,
  getAuthTokenFromUserId,
  logoutSessionByAuthToken,
} from "@/services/kratos"

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
  const validation = await kratosValidateTotp({ authToken, totpCode, totpRegistrationId })
  if (validation instanceof Error) return validation

  const res = await validateKratosToken(authToken)
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
