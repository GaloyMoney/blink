type AdminTriggerMarketingNotificationArgs = {
  userIdsFilter: string[] | undefined
  phoneCountryCodesFilter: string[] | undefined
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

type AdminFilteredUserCountArgs = {
  userIdsFilter: string[] | undefined
  phoneCountryCodesFilter: string[] | undefined
}
