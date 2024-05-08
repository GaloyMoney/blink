import { checkedToUserId } from "@/domain/accounts"
import { checkedToLocalizedNotificationContentsMap } from "@/domain/notifications"
import { UsersRepository } from "@/services/mongoose"
import { NotificationsService } from "@/services/notifications"

export const triggerMarketingNotification = async ({
  userIdsFilter,
  phoneCountryCodesFilter,
  openDeepLink,
  openExternalUrl,
  shouldSendPush,
  shouldAddToHistory,
  shouldAddToBulletin,
  localizedNotificationContents,
}: AdminTriggerMarketingNotificationArgs): Promise<ApplicationError | true> => {
  const checkedUserIds: UserId[] = []
  for (const userId of userIdsFilter || []) {
    const checkedUserId = checkedToUserId(userId)
    if (checkedUserId instanceof Error) {
      return checkedUserId
    }
    checkedUserIds.push(checkedUserId)
  }

  const localizedNotificationContentsMap = checkedToLocalizedNotificationContentsMap(
    localizedNotificationContents,
  )

  if (localizedNotificationContentsMap instanceof Error) {
    return localizedNotificationContentsMap
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
    openDeepLink,
    openExternalUrl,
    shouldSendPush,
    shouldAddToHistory,
    shouldAddToBulletin,
    localizedContents: localizedNotificationContentsMap,
  })
}
