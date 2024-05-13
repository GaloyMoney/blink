import { GT } from "@/graphql/index"
import CountryCode from "@/graphql/public/types/scalar/country-code"
import Language from "@/graphql/shared/types/scalar/language"
import { Admin } from "@/app"
import { mapAndParseErrorForGqlResponse } from "@/graphql/error-map"
import DeepLinkScreen from "@/graphql/admin/types/scalar/deep-link-screen"
import SuccessPayload from "@/graphql/shared/types/payload/success-payload"
import DeepLinkAction from "@/graphql/admin/types/scalar/deep-link-action"
import ExternalUrl from "@/graphql/admin/types/scalar/external-url"
import NotificationIcon from "@/graphql/admin/types/scalar/notification-icon"

const LocalizedNotificationContentInput = GT.Input({
  name: "LocalizedNotificationContentInput",
  fields: () => ({
    language: {
      type: GT.NonNull(Language),
    },
    title: {
      type: GT.NonNull(GT.String),
    },
    body: {
      type: GT.NonNull(GT.String),
    },
  }),
})

const OpenDeepLinkInput = GT.Input({
  name: "OpenDeepLinkInput",
  fields: () => ({
    screen: {
      type: DeepLinkScreen,
    },
    action: {
      type: DeepLinkAction,
    },
  }),
})

const OpenExternalUrlInput = GT.Input({
  name: "OpenExternalUrlInput",
  fields: () => ({
    url: {
      type: GT.NonNull(ExternalUrl),
    },
  }),
})

const MarketingNotificationTriggerInput = GT.Input({
  name: "MarketingNotificationTriggerInput",
  fields: () => ({
    userIdsFilter: {
      type: GT.List(GT.NonNullID),
    },
    phoneCountryCodesFilter: {
      type: GT.List(GT.NonNull(CountryCode)),
    },
    shouldSendPush: {
      type: GT.NonNull(GT.Boolean),
    },
    shouldAddToHistory: {
      type: GT.NonNull(GT.Boolean),
    },
    shouldAddToBulletin: {
      type: GT.NonNull(GT.Boolean),
    },
    openDeepLink: {
      type: OpenDeepLinkInput,
    },
    openExternalUrl: {
      type: OpenExternalUrlInput,
    },
    icon: {
      type: NotificationIcon,
    },
    localizedNotificationContents: {
      type: GT.NonNullList(LocalizedNotificationContentInput),
    },
  }),
})

const MarketingNotificationTriggerMutation = GT.Field<
  null,
  GraphQLAdminContext,
  {
    input: {
      userIdsFilter: (string | Error)[] | undefined
      phoneCountryCodesFilter: (string | Error)[] | undefined
      shouldSendPush: boolean
      shouldAddToHistory: boolean
      shouldAddToBulletin: boolean
      icon: Icon | Error | undefined
      openDeepLink:
        | {
            screen: DeepLinkScreen | Error | undefined
            action: DeepLinkAction | Error | undefined
          }
        | undefined
      openExternalUrl: { url: string | Error } | undefined
      localizedNotificationContents: {
        title: string
        body: string
        language: string | Error
      }[]
    }
  }
>({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(SuccessPayload),
  args: {
    input: { type: GT.NonNull(MarketingNotificationTriggerInput) },
  },
  resolve: async (_, args) => {
    const {
      userIdsFilter,
      phoneCountryCodesFilter,
      shouldSendPush,
      shouldAddToHistory,
      shouldAddToBulletin,
      icon,
      openDeepLink,
      openExternalUrl,
      localizedNotificationContents,
    } = args.input

    const nonErrorUserIdsFilter: string[] = []
    for (const id of userIdsFilter || []) {
      if (id instanceof Error) {
        return { errors: [{ message: id.message }], success: false }
      }
      nonErrorUserIdsFilter.push(id)
    }

    let nonErrorOpenDeepLink = undefined
    if (openDeepLink) {
      if (openDeepLink.action instanceof Error) {
        return { errors: [{ message: openDeepLink.action.message }], success: false }
      }

      if (openDeepLink.screen instanceof Error) {
        return { errors: [{ message: openDeepLink.screen.message }], success: false }
      }

      nonErrorOpenDeepLink = {
        screen: openDeepLink.screen,
        action: openDeepLink.action,
      }
    }

    if (icon instanceof Error) {
      return { errors: [{ message: icon.message }], success: false }
    }

    let nonErrorOpenExternalUrl = undefined
    if (openExternalUrl) {
      if (openExternalUrl.url instanceof Error) {
        return { errors: [{ message: openExternalUrl.url.message }], success: false }
      }
      nonErrorOpenExternalUrl = {
        url: openExternalUrl.url,
      }
    }

    const nonErrorPhoneCountryCodesFilter: string[] = []
    for (const code of phoneCountryCodesFilter || []) {
      if (code instanceof Error) {
        return { errors: [{ message: code.message }], success: false }
      }
      nonErrorPhoneCountryCodesFilter.push(code)
    }

    const nonErrorLocalizedNotificationContents: {
      title: string
      body: string
      language: string
    }[] = []

    for (const content of localizedNotificationContents) {
      if (content.language instanceof Error) {
        return { errors: [{ message: content.language.message }], success: false }
      }
      nonErrorLocalizedNotificationContents.push({
        title: content.title,
        body: content.body,
        language: content.language,
      })
    }

    const res = await Admin.triggerMarketingNotification({
      userIdsFilter: nonErrorUserIdsFilter,
      phoneCountryCodesFilter: nonErrorPhoneCountryCodesFilter,
      openDeepLink: nonErrorOpenDeepLink,
      openExternalUrl: nonErrorOpenExternalUrl,
      shouldSendPush,
      shouldAddToHistory,
      shouldAddToBulletin,
      icon,
      localizedNotificationContents: nonErrorLocalizedNotificationContents,
    })

    if (res instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(res)], success: false }
    }

    return {
      errors: [],
      success: res,
    }
  },
})

export default MarketingNotificationTriggerMutation
