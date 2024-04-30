import { GT } from "@/graphql/index"
import CountryCode from "@/graphql/public/types/scalar/country-code"
import Language from "@/graphql/shared/types/scalar/language"
import { Admin } from "@/app"
import { mapAndParseErrorForGqlResponse } from "@/graphql/error-map"
import DeepLinkScreen from "@/graphql/admin/types/scalar/deep-link-screen"
import SuccessPayload from "@/graphql/shared/types/payload/success-payload"
import DeepLinkAction from "@/graphql/admin/types/scalar/deep-link-action"

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
    deepLinkScreen: {
      type: DeepLinkScreen,
    },
    deepLinkAction: {
      type: DeepLinkAction,
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
      deepLinkScreen: DeepLinkScreen | Error | undefined
      deepLinkAction: DeepLinkAction | Error | undefined
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
      deepLinkScreen,
      deepLinkAction,
      localizedNotificationContents,
    } = args.input

    const nonErrorUserIdsFilter: string[] = []
    for (const id of userIdsFilter || []) {
      if (id instanceof Error) {
        return { errors: [{ message: id.message }], success: false }
      }
      nonErrorUserIdsFilter.push(id)
    }

    if (deepLinkScreen instanceof Error) {
      return { errors: [{ message: deepLinkScreen.message }], success: false }
    }

    if (deepLinkAction instanceof Error) {
      return { errors: [{ message: deepLinkAction.message }], success: false }
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
      deepLinkScreen,
      deepLinkAction,
      shouldSendPush,
      shouldAddToHistory,
      shouldAddToBulletin,
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
