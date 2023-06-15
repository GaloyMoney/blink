import { AuthenticationKratosError, UnknownKratosError } from "./errors"
import { kratosPublic, listSessionsInternal, toDomainSession } from "./private"

export * from "./auth-phone-no-password"
export * from "./cron"
export * from "./identity"
export * from "./auth-username-password-deviceid"

export const listSessions = async (userId: UserId): Promise<Session[] | KratosError> => {
  const res = await listSessionsInternal(userId)
  if (res instanceof Error) return res
  return res.map(toDomainSession)
}

export const validateKratosToken = async (
  sessionToken: SessionToken,
): Promise<ValidateKratosTokenResult | KratosError> => {
  let session: Session

  try {
    const { data } = await kratosPublic.toSession({ xSessionToken: sessionToken })
    session = toDomainSession(data)
  } catch (err) {
    if (err.message === "Request failed with status code 401") {
      return new AuthenticationKratosError(err)
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
    if (err.message === "Request failed with status code 401") {
      return new AuthenticationKratosError(err)
    }
    return new UnknownKratosError(err)
  }

  // TODO: should return aal level also
  return {
    kratosUserId: session.identity.id,
    session,
  }
}
