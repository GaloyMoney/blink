import { ErrorLevel } from "@domain/shared"
import {
  extendSession,
  IdentityRepository,
  ExtendSessionKratosError,
  listSessions,
} from "@services/kratos"

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

    const sessions = await listSessions(user.id)
    if (sessions instanceof Error) {
      recordExceptionInCurrentSpan({
        error: sessions,
        level: ErrorLevel.Info,
        attributes: { user: user.id, phone: user.phone, email: user.email },
      })
      continue
    }

    for (const session of sessions) {
      countOfTotalSessions++
      const hasExtended = await extendSession(session.id)
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
  logger.info(
    {
      countOfTotalSessions,
      countOfExtendedSessions,
      countOfExtendedSessionErrors,
      countOfInactiveSessions,
    },
    `sessions info`,
  )

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
