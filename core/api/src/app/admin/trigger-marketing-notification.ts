import { checkedToUserId } from "@/domain/accounts"
import { checkedToLocalizedPushContentsMap } from "@/domain/notifications"
import { UsersRepository } from "@/services/mongoose"
import { NotificationsService } from "@/services/notifications"

export const triggerMarketingNotification = async ({
  userIdsFilter,
  phoneCountryCodesFilter,
  deepLink,
  localizedPushContents,
}: AdminTriggerMarketingNotificationArgs): Promise<ApplicationError | true> => {
  const checkedUserIds: UserId[] = []
  for (const userId of userIdsFilter || []) {
    const checkedUserId = checkedToUserId(userId)
    if (checkedUserId instanceof Error) {
      return checkedUserId
    }
    checkedUserIds.push(checkedUserId)
  }

  const localizedPushContentsMap =
    checkedToLocalizedPushContentsMap(localizedPushContents)

  if (localizedPushContentsMap instanceof Error) {
    return localizedPushContentsMap
  }

  const userIdsToNotify: UserId[] = []
  const userIdsGenerator = UsersRepository().find({
    userIds: checkedUserIds,
    phoneCountryCodes: phoneCountryCodesFilter || [],
  })

  if (userIdsGenerator instanceof Error) {
    return userIdsGenerator
  }

  for await (const userIdToNotify of userIdsGenerator) {
    userIdsToNotify.push(userIdToNotify)
  }

  return NotificationsService().triggerMarketingNotification({
    userIds: userIdsToNotify,
    deepLink,
    localizedPushContents: localizedPushContentsMap,
  })
}
