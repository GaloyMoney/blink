import { AuthWithPhonePasswordlessService } from "./auth-phone-no-password"
import { handleKratosErrors } from "./errors"
import { kratosAdmin, kratosPublic, toDomainSession } from "./private"

import { KRATOS_MASTER_USER_PASSWORD } from "@/config"

import { InvalidFlowId, InvalidTotpCode } from "@/domain/errors"
import { AuthenticationKratosError, UnknownKratosError } from "@/domain/kratos"
import { UuidRegex } from "@/domain/shared"

export * from "./auth-email-no-password"
export * from "./auth-phone-no-password"
export * from "./auth-username-password-deviceid"
export * from "./cron"
export * from "./errors"
export * from "./identity"
export * from "./schema"
export * from "./totp"

export const checkedToEmailRegistrationId = (
  flow: string,
): EmailRegistrationId | ValidationError => {
  if (!flow.match(UuidRegex)) {
    return new InvalidFlowId(flow)
  }
  return flow as EmailRegistrationId
}

export const checkedToTotpRegistrationId = (
  flow: string,
): TotpRegistrationId | ValidationError => {
  if (!flow.match(UuidRegex)) {
    return new InvalidFlowId(flow)
  }
  return flow as TotpRegistrationId
}

export const checkedToEmailLoginId = (flow: string): EmailLoginId | ValidationError => {
  if (!flow.match(UuidRegex)) {
    return new InvalidFlowId(flow)
  }
  return flow as EmailLoginId
}

export const checkedToTotpCode = (totpCode: string): TotpCode | ValidationError => {
  if (totpCode.length !== 6) {
    return new InvalidTotpCode(totpCode)
  }
  return totpCode as TotpCode
}

export const checkedToAuthToken = (value: string) => {
  // 32 is the length of a session token in kratos v11
  // 39 is the length of a session token in kratos v13
  if (value.length !== 32 && value.length !== 39) {
    return "Invalid value for AuthToken"
  }

  return value as AuthToken
}

export const validateKratosToken = async (
  authToken: AuthToken,
): Promise<ValidateKratosTokenResult | KratosError> => {
  let session: Session

  try {
    const { data } = await kratosPublic.toSession({ xSessionToken: authToken })
    session = toDomainSession(data)
  } catch (err) {
    if (err instanceof Error && err.message === "Request failed with status code 401") {
      return new AuthenticationKratosError(err.message)
    }
    return handleKratosErrors(err)
  }

  // TODO: should return aal level also
  return {
    kratosUserId: session.identity.id,
    session,
  }
}

export const listSessions = async (userId: UserId): Promise<Session[] | KratosError> => {
  try {
    const res = await kratosAdmin.listIdentitySessions({ id: userId })
    if (res.data === null) return []
    const data = res.data as KratosSession[]
    return data.map(toDomainSession)
  } catch (err) {
    return handleKratosErrors(err)
  }
}

export const logoutSessionByAuthToken = async (authToken: AuthToken) => {
  try {
    const authService = AuthWithPhonePasswordlessService()
    const sessionResponse = await kratosPublic.toSession({ xSessionToken: authToken })
    const sessionId = sessionResponse.data.id as SessionId
    await authService.logoutToken({ sessionId })
  } catch (err) {
    return handleKratosErrors(err)
  }
}

export const refreshToken = async (authToken: AuthToken): Promise<void | KratosError> => {
  try {
    const method = "password"
    const password = KRATOS_MASTER_USER_PASSWORD

    const session = await kratosPublic.toSession({ xSessionToken: authToken })
    const identifier =
      session.data.identity?.traits?.phone || session.data.identity?.traits?.email

    if (!identifier) {
      return new UnknownKratosError("No identifier found")
    }
    const flow = await kratosPublic.createNativeLoginFlow({
      refresh: true,
      xSessionToken: authToken,
    })
    await kratosPublic.updateLoginFlow({
      flow: flow.data.id,
      updateLoginFlowBody: {
        identifier,
        method,
        password,
      },
      xSessionToken: authToken,
    })
  } catch (err) {
    return handleKratosErrors(err)
  }
}
