import { ErrorLevel } from "@domain/shared"
import { extendSession, listIdentities } from "@services/kratos"

// TODO: interface/type should be reworked so that it doesn't have to come from private
import { listSessionsInternal } from "@services/kratos/private"
import { recordExceptionInCurrentSpan } from "@services/tracing"

export const extendSessions = async (): Promise<void | KratosError> => {
  const users = await listIdentities()
  if (users instanceof Error) throw users

  for (const user of users) {
    const sessions = await listSessionsInternal(user.id)
    if (sessions instanceof Error) {
      recordExceptionInCurrentSpan({
        error: "impossible to get session",
        level: ErrorLevel.Info,
        attributes: { user: user.id, phone: user.phone },
      })
      continue
    }

    for (const session of sessions) {
      const res = await extendSession({ session })
      if (res instanceof Error) {
        recordExceptionInCurrentSpan({
          error: "impossible to extend session",
          level: ErrorLevel.Info,
          attributes: { user: user.id, phone: user.phone },
        })
      }
    }
  }
}
