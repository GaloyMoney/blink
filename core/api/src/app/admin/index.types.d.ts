type AdminTriggerMarketingNotificationArgs = {
  userIdsFilter: string[] | undefined
  phoneCountryCodesFilter: string[] | undefined
  openDeepLink:
    | {
        screen: DeepLinkScreen | undefined
        action: DeepLinkAction | undefined
      }
    | undefined
  openExternalUrl:
    | {
        url: string
      }
    | undefined
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
