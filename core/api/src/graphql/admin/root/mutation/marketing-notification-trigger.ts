import { GT } from "@/graphql/index"
import CountryCode from "@/graphql/public/types/scalar/country-code"
import Language from "@/graphql/shared/types/scalar/language"
import { Admin } from "@/app"
import { mapAndParseErrorForGqlResponse } from "@/graphql/error-map"
import DeepLink from "@/graphql/admin/types/scalar/deep-link"
import SuccessPayload from "@/graphql/shared/types/payload/success-payload"

const LocalizedPushContentInput = GT.Input({
  name: "LocalizedPushContentInput",
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
    deepLink: {
      type: DeepLink,
    },
    localizedPushContents: {
      type: GT.NonNullList(LocalizedPushContentInput),
    },
  }),
})

const MarketingNotificationTriggerMutation = GT.Field<
  null,
  GraphQLAdminContext,
  {
    input: {
      userIdsFilter: string[] | undefined
      phoneCountryCodesFilter: (string | Error)[] | undefined
      deepLink: DeepLink | Error | undefined
      localizedPushContents: {
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
    const { userIdsFilter, phoneCountryCodesFilter, deepLink, localizedPushContents } =
      args.input

    if (deepLink instanceof Error) {
      return { errors: [{ message: deepLink.message }], success: false }
    }

    const nonErrorPhoneCountryCodesFilter: string[] = []
    for (const code of phoneCountryCodesFilter || []) {
      if (code instanceof Error) {
        return { errors: [{ message: code.message }], success: false }
      }
      nonErrorPhoneCountryCodesFilter.push(code)
    }

    const nonErrorLocalizedPushContents: {
      title: string
      body: string
      language: string
    }[] = []

    for (const content of localizedPushContents) {
      if (content.language instanceof Error) {
        return { errors: [{ message: content.language.message }], success: false }
      }
      nonErrorLocalizedPushContents.push({
        title: content.title,
        body: content.body,
        language: content.language,
      })
    }

    const res = await Admin.triggerMarketingNotification({
      userIdsFilter,
      phoneCountryCodesFilter: nonErrorPhoneCountryCodesFilter,
      deepLink,
      localizedPushContents: nonErrorLocalizedPushContents,
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
