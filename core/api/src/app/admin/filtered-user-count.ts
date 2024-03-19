import { checkedToUserId } from "@/domain/accounts"
import { UsersRepository } from "@/services/mongoose"

export const filteredUserCount = async ({
  userIdsFilter,
  phoneCountryCodesFilter,
}: AdminFilteredUserCountArgs): Promise<ApplicationError | number> => {
  const checkedUserIds: UserId[] = []
  for (const userId of userIdsFilter || []) {
    const checkedUserId = checkedToUserId(userId)
    if (checkedUserId instanceof Error) {
      return checkedUserId
    }
    checkedUserIds.push(checkedUserId)
  }

  return UsersRepository().count({
    userIds: checkedUserIds,
    phoneCountryCodes: phoneCountryCodesFilter || [],
  })
}
