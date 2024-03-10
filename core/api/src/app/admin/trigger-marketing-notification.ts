import { checkedToUserId } from "@/domain/accounts"
import { checkedToNonEmptyLanguage } from "@/domain/users"
import { UsersRepository } from "@/services/mongoose"
import { NotificationsService } from "@/services/notifications"

export const triggerMarketingNotification = async ({
  userIdsFilter,
  phoneCountryCodesFilter,
  deepLink,
  localizedPushContent,
}: {
  userIdsFilter: string[] | undefined
  phoneCountryCodesFilter: string[] | undefined
  deepLink: string | undefined
  localizedPushContent: {
    title: string
    body: string
    language: string
  }[]
}): Promise<
  | ApplicationError
  | {
      success: boolean
    }
> => {
  const checkedUserIds: UserId[] = []
  for (const userId of userIdsFilter || []) {
    const checkedUserId = checkedToUserId(userId)
    if (checkedUserId instanceof Error) {
      return checkedUserId
    }
    checkedUserIds.push(checkedUserId)
  }

  const checkedLocalizedPushContent: {
    title: string
    body: string
    language: UserLanguage
  }[] = []
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

  let userIdsToNotify: UserId[] = []
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

  return { success: true }
}

export const filteredUserCount = async ({
  userIdsFilter,
  phoneCountryCodesFilter,
}: {
  userIdsFilter: string[] | undefined
  phoneCountryCodesFilter: string[] | undefined
}): Promise<ApplicationError | number> => {
  const checkedUserIds: UserId[] = []
  for (const userId of userIdsFilter || []) {
    const checkedUserId = checkedToUserId(userId)
    if (checkedUserId instanceof Error) {
      return checkedUserId
    }
    checkedUserIds.push(checkedUserId)
  }

  const userIdsGenerator = UsersRepository().findByFilter({
    userIds: checkedUserIds,
    phoneCountryCodes: phoneCountryCodesFilter || [],
  })

  if (userIdsGenerator instanceof Error) {
    return userIdsGenerator
  }

  let count = 0
  for await (const _ of userIdsGenerator) {
    count++
  }

  return count
}
