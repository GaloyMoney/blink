import { UnknownKratosError } from "./errors"
import {
  kratosAdmin,
  listSessionsInternal,
  toDomainIdentityPhone,
  toDomainSession,
} from "./private"

export * from "./auth-phone-no-password"
export * from "./cron"

export const listSessions = async (
  userId: KratosUserId,
): Promise<Session[] | KratosError> => {
  const res = await listSessionsInternal(userId)
  if (res instanceof Error) return res
  return res.map(toDomainSession)
}

export const listIdentities = async (): Promise<IdentityPhone[] | KratosError> => {
  try {
    const res = await kratosAdmin.adminListIdentities()
    return res.data.map(toDomainIdentityPhone)
  } catch (err) {
    return new UnknownKratosError(err)
  }
}
