"use server"

import { getClient } from "../../app/graphql-rsc"
import {
  DeepLink,
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
  deepLink?: DeepLink
  localizedPushContents: {
    title: string
    body: string
    language: string
  }[]
}

export const triggerMarketingNotification = async ({
  deepLink,
  localizedPushContents,
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
        deepLink,
        localizedPushContents,
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
