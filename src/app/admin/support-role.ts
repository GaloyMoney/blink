import { SupportRole } from "@domain/authorization"

export const getSupportRoleForUser = async ({
  loggedInUserId,
  userId,
}: {
  loggedInUserId: UserId
  userId: string
}): Promise<SupportRole | ApplicationError> => {
  return SupportRole.Level1
}
