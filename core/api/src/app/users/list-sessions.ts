import { listSessions as listSessionsService } from "@/services/kratos"

export const listMobileSessions = async (userId: UserId) => {
  const list = await listSessionsService(userId)
  console.dir(list)
  return list
}

export const listDeleguateSessions = async (userId: UserId) => {
  
}
