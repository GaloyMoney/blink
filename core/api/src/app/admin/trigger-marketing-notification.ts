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
  throw new Error("Not implemented")
}
