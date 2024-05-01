"use server"

import { getClient } from "../../app/graphql-rsc"
import { validUsername } from "../../app/utils"
import {
  AccountDetailsByUsernameDocument,
  AccountDetailsByUsernameQuery,
  AccountDetailsByUsernameQueryVariables,
  DeepLinkScreen,
  DeepLinkAction,
  FilteredUserCountDocument,
  FilteredUserCountQuery,
  FilteredUserCountQueryVariables,
  MarketingNotificationTriggerDocument,
  MarketingNotificationTriggerMutation,
  MarketingNotificationTriggerMutationVariables,
} from "../../generated"

export type GetFilteredUserCountArgs = {
  userIdsFilter?: string[]
  phoneCountryCodesFilter?: string[]
}
export const filteredUserCount = async ({
  phoneCountryCodesFilter,
  userIdsFilter,
}: GetFilteredUserCountArgs) => {
  const data = await getClient().query<
    FilteredUserCountQuery,
    FilteredUserCountQueryVariables
  >({
    query: FilteredUserCountDocument,
    variables: {
      phoneCountryCodesFilter,
      userIdsFilter,
    },
  })

  return data.data.filteredUserCount
}

export type TriggerMarketingNotificationArgs = {
  userIdsFilter?: string[]
  phoneCountryCodesFilter?: string[]
  deepLinkScreen: DeepLinkScreen | undefined
  deepLinkAction: DeepLinkAction | undefined
  shouldSendPush: boolean
  shouldAddToHistory: boolean
  shouldAddToBulletin: boolean
  localizedNotificationContents: {
    title: string
    body: string
    language: string
  }[]
}

export const triggerMarketingNotification = async ({
  deepLinkScreen,
  deepLinkAction,
  shouldSendPush,
  shouldAddToBulletin,
  shouldAddToHistory,
  localizedNotificationContents,
  phoneCountryCodesFilter,
  userIdsFilter,
}: TriggerMarketingNotificationArgs) => {
  const res = await getClient().mutate<
    MarketingNotificationTriggerMutation,
    MarketingNotificationTriggerMutationVariables
  >({
    mutation: MarketingNotificationTriggerDocument,
    variables: {
      input: {
        deepLinkScreen,
        deepLinkAction,
        shouldSendPush,
        shouldAddToBulletin,
        shouldAddToHistory,
        localizedNotificationContents,
        phoneCountryCodesFilter,
        userIdsFilter,
      },
    },
  })

  if (res.errors?.length) {
    return {
      message: res.errors[0].message,
      success: false,
    }
  }

  if (
    res.data?.marketingNotificationTrigger.errors.length &&
    !res.data?.marketingNotificationTrigger.success
  ) {
    return {
      message: res.data.marketingNotificationTrigger.errors[0].message,
      success: false,
    }
  }

  if (!res.data?.marketingNotificationTrigger.success) {
    return {
      message: "An error occurred",
      success: false,
    }
  }

  return {
    success: true,
  }
}

export const userIdByUsername = async (username: string) => {
  try {
    if (!validUsername(username)) {
      return {
        message: "Invalid username",
      } as const
    }

    const data = await getClient().query<
      AccountDetailsByUsernameQuery,
      AccountDetailsByUsernameQueryVariables
    >({
      query: AccountDetailsByUsernameDocument,
      variables: { username },
    })
    const userId = data.data?.accountDetailsByUsername.owner.id

    return {
      userId,
    } as const
  } catch (err) {
    if (err instanceof Error) {
      return {
        message: err.message,
      } as const
    }
    return {
      message: "Unknown error occurred while fetching user id",
    } as const
  }
}
