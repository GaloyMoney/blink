export * from "./login"
export * from "./logout"
export * from "./request-phone-code"
export * from "./get-supported-countries"

import { ErrorLevel } from "@domain/shared"
import { extendSession, IdentityRepository } from "@services/kratos"

// TODO: interface/type should be reworked so that it doesn't have to come from private
import { listSessionsInternal } from "@services/kratos/private"
import { ExtendSessionKratosError } from "@services/kratos/errors"
import {
  recordExceptionInCurrentSpan,
  addAttributesToCurrentSpan,
} from "@services/tracing"

export const extendSessions = async (
  parentLogger: Logger,
): Promise<void | KratosError> => {
  const logger = parentLogger.child({
    topic: "extendSessions",
  })

  const users = await IdentityRepository().listIdentities()
  if (users instanceof Error) return users

  const countOfTotalUsers = users.length
  logger.info(`Total users: ${countOfTotalUsers}`)

  let countOfTotalSessions = 0
  let countOfExtendedSessions = 0
  let countOfExtendedSessionErrors = 0
  let countOfInactiveSessions = 0

  for (const [i, user] of users.entries()) {
    const logInterval = 100
    if (i % logInterval === 0 || i === users.length - 1) {
      logger.info(`Processing user at index: ${i}`)
    }

    const sessions = await listSessionsInternal(user.id)
    if (sessions instanceof Error) {
      recordExceptionInCurrentSpan({
        error: sessions,
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
          error: new ExtendSessionKratosError("impossible to extend session"),
          level: ErrorLevel.Info,
          attributes: { user: user.id, phone: user.phone },
        })
      }
      hasExtended ? countOfExtendedSessions++ : countOfInactiveSessions++
    }
  }
  logger.info(`Total sessions: ${countOfTotalSessions}`)
  logger.info(`Extended sessions: ${countOfExtendedSessions}`)
  logger.info(`Extended-error sessions: ${countOfExtendedSessionErrors}`)
  logger.info(`Inactive sessions: ${countOfInactiveSessions}`)

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
