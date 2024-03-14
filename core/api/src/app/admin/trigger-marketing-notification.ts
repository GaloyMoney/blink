import { checkedToUserId } from "@/domain/accounts"
import { checkedToNonEmptyLanguage } from "@/domain/users"
import { UsersRepository } from "@/services/mongoose"
import { NotificationsService } from "@/services/notifications"

export const triggerMarketingNotification = async ({
  userIdsFilter,
  phoneCountryCodesFilter,
  deepLink,
  localizedPushContent,
}: AdminTriggerMarketingNotificationArgs): Promise<ApplicationError | true> => {
  const checkedUserIds: UserId[] = []
  for (const userId of userIdsFilter || []) {
    const checkedUserId = checkedToUserId(userId)
    if (checkedUserId instanceof Error) {
      return checkedUserId
    }
    checkedUserIds.push(checkedUserId)
  }

  const checkedLocalizedPushContent: LocalizedPushContent[] = []
  for (const content of localizedPushContent) {
    const checkedLanguage = checkedToNonEmptyLanguage(content.language)
    if (checkedLanguage instanceof Error) {
      return checkedLanguage
    }
    checkedLocalizedPushContent.push({
      title: content.title,
      body: content.body,
      language: checkedLanguage,
    })
  }

  const userIdsToNotify: UserId[] = []
  const userIdsGenerator = UsersRepository().findByFilter({
    userIds: checkedUserIds,
    phoneCountryCodes: phoneCountryCodesFilter || [],
  })

  if (userIdsGenerator instanceof Error) {
    return userIdsGenerator
  }

  for await (const userIdToNotify of userIdsGenerator) {
    userIdsToNotify.push(userIdToNotify)
  }

  const res = await NotificationsService().triggerMarketingNotification({
    userIds: userIdsToNotify,
    deepLink,
    localizedPushContent: checkedLocalizedPushContent,
  })

  if (res instanceof Error) {
    return res
  }

  return true
}

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

  const count = UsersRepository().filteredCount({
    userIds: checkedUserIds,
    phoneCountryCodes: phoneCountryCodesFilter || [],
  })

  if (count instanceof Error) {
    return count
  }

  return count
}
