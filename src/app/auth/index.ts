export * from "./login"
export * from "./logout"
export * from "./request-phone-code"

import { ErrorLevel } from "@domain/shared"
import { extendSession, IdentityRepository } from "@services/kratos"

// TODO: interface/type should be reworked so that it doesn't have to come from private
import { listSessionsInternal } from "@services/kratos/private"
import {
  recordExceptionInCurrentSpan,
  addAttributesToCurrentSpan,
} from "@services/tracing"

export const extendSessions = async (): Promise<void | KratosError> => {
  const users = await IdentityRepository().listIdentities()
  if (users instanceof Error) return users

  const countOfTotalUsers = users.length
  let countOfTotalSessions = 0
  let countOfExtendedSessions = 0
  let countOfExtendedSessionErrors = 0
  let countOfInactiveSessions = 0

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
      countOfTotalSessions++
      const hasExtended = await extendSession({ session })
      if (hasExtended instanceof Error) {
        countOfExtendedSessionErrors++
        recordExceptionInCurrentSpan({
          error: "impossible to extend session",
          level: ErrorLevel.Info,
          attributes: { user: user.id, phone: user.phone },
        })
      }
      hasExtended ? countOfExtendedSessions++ : countOfInactiveSessions++
    }
  }
  addAttributesToCurrentSpan({
    countOfTotalUsers: countOfTotalUsers === 0 ? "none" : countOfTotalUsers, // *0 does not log in honeycomb properly sometimes, so set to none
    countOfTotalSessions: countOfTotalSessions === 0 ? "none" : countOfTotalSessions,
    countOfExtendedSessions:
      countOfExtendedSessions === 0 ? "none" : countOfExtendedSessions,
    countOfExtendedSessionErrors:
      countOfExtendedSessionErrors === 0 ? "none" : countOfExtendedSessionErrors,
    countOfInactiveSessions:
      countOfInactiveSessions === 0 ? "none" : countOfInactiveSessions,
  })
}
