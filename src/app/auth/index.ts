export * from "./login"
export * from "./request-phone-code"

import { extendSession, IdentityRepository } from "@services/kratos"

// TODO: interface/type should be reworled so that it doesn't have to come from private
import { listSessionsInternal } from "@services/kratos/private"

export const extendSessions = async (): Promise<void | KratosError> => {
  const users = await IdentityRepository().listIdentities()
  if (users instanceof Error) return users

  for (const user of users) {
    const sessions = await listSessionsInternal(user.id)
    if (sessions instanceof Error) return sessions

    for (const session of sessions) {
      await extendSession({ session })
    }
  }
}
