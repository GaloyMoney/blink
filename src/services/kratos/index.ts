import { InvalidFlowId, InvalidTotpCode } from "@domain/errors"

import { AuthenticationKratosError, UnknownKratosError } from "./errors"
import { kratosAdmin, kratosPublic, toDomainSession } from "./private"

export * from "./auth-phone-no-password"
export * from "./auth-email-no-password"
export * from "./auth-username-password-deviceid"
export * from "./cron"
export * from "./errors"
export * from "./identity"
export * from "./totp"
export * from "./schema"

export const UuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

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

export const validateKratosToken = async (
  sessionToken: SessionToken,
): Promise<ValidateKratosTokenResult | KratosError> => {
  let session: Session

  try {
    const { data } = await kratosPublic.toSession({ xSessionToken: sessionToken })
    session = toDomainSession(data)
  } catch (err) {
    if (err instanceof Error && err.message === "Request failed with status code 401") {
      return new AuthenticationKratosError(err.message)
    }
    return new UnknownKratosError(err)
  }

  // TODO: should return aal level also
  return {
    kratosUserId: session.identity.id,
    session,
  }
}

export const validateKratosCookie = async (
  cookie: string,
): Promise<ValidateKratosTokenResult | KratosError> => {
  let session: Session

  try {
    const { data } = await kratosPublic.toSession({ cookie })
    session = toDomainSession(data)
  } catch (err) {
    if (err instanceof Error && err.message === "Request failed with status code 401") {
      return new AuthenticationKratosError(err.message)
    }
    return new UnknownKratosError(err)
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
    return new UnknownKratosError(err)
  }
}
