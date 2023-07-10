import {
  IdentityRepository,
  validateKratosToken,
  kratosValidateTotp,
  kratosInitiateTotp,
  kratosElevatingSessionWithTotp,
} from "@services/kratos"

import { UsersRepository } from "@services/mongoose"

export const initiateTotpRegistration = async ({
  authToken,
}: {
  authToken: SessionToken
}): Promise<InitiateTotpRegistrationResult | KratosError> => {
  return kratosInitiateTotp(authToken)
}

export const validateTotpRegistration = async ({
  authToken,
  totpCode,
  totpRegistrationId,
}: {
  authToken: SessionToken
  totpCode: TotpCode
  totpRegistrationId: TotpRegistrationId
}): Promise<User | ApplicationError> => {
  const validation = await kratosValidateTotp({ authToken, totpCode, totpRegistrationId })
  if (validation instanceof Error) return validation

  const res = await validateKratosToken(authToken)
  if (res instanceof Error) return res

  const identity = await IdentityRepository().getIdentity(res.kratosUserId)
  if (identity instanceof Error) return identity

  const me = await UsersRepository().findById(identity.id)
  if (me instanceof Error) return me

  return me
}

export const elevatingSessionWithTotp = async ({
  sessionToken,
  totpCode,
}: {
  sessionToken: SessionToken
  totpCode: TotpCode
}): Promise<boolean | KratosError> => {
  return kratosElevatingSessionWithTotp({ sessionToken, totpCode })
}
