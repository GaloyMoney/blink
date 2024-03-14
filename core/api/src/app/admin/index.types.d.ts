type AdminTriggerMarketingNotificationArgs = {
  userIdsFilter: string[] | undefined
  phoneCountryCodesFilter: string[] | undefined
  deepLink: DeepLink | undefined
  localizedPushContent: {
    title: string
    body: string
    language: string
  }[]
}

type AdminFilteredUserCountArgs = {
  userIdsFilter: string[] | undefined
  phoneCountryCodesFilter: string[] | undefined
}
