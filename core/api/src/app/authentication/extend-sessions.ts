import { extendSession } from "@/services/kratos"

export const maybeExtendSession = async ({
  sessionId,
  expiresAt,
  monthsToExtend = 12,
}: {
  sessionId: string
  expiresAt: string
  monthsToExtend?: number
}): Promise<boolean | void | Error> => {
  const futureDate = new Date()
  // related to session.lifespan value in kratos.yaml
  futureDate.setMonth(futureDate.getMonth() + monthsToExtend)

  const renewToken = futureDate > new Date(expiresAt)

  if (renewToken) {
    return extendSession(sessionId as SessionId)
  }

  return
}
