import { consentList } from "@/services/hydra"
import { listSessions as listSessionsService } from "@/services/kratos"

export const listMobileSessions = async ({ userId }: { userId: UserId }) => {
  return listSessionsService(userId)
}

export const listDeleguations = async ({ userId }: { userId: UserId }) => {
  return consentList(userId)
}
