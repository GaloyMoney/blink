type AdminTriggerMarketingNotificationArgs = {
  userIdsFilter: string[] | undefined
  phoneCountryCodesFilter: string[] | undefined
  deepLink: DeepLink | undefined
  localizedPushContents: {
    title: string
    body: string
    language: string
  }[]
}

type AdminFilteredUserCountArgs = {
  userIdsFilter: string[] | undefined
  phoneCountryCodesFilter: string[] | undefined
}
