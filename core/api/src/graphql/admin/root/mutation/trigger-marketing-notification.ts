import { GT } from "@/graphql/index"
import CountryCode from "@/graphql/public/types/scalar/country-code"
import Language from "@/graphql/shared/types/scalar/language"
import { TriggerMarketingNotificationPayload } from "../../types/payload/trigger-marketing-notification"
import { Admin } from "@/app"
import { mapAndParseErrorForGqlResponse } from "@/graphql/error-map"

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

const TriggerMarketingNotificationInput = GT.Input({
  name: "TriggerMarketingNotificationInput",
  fields: () => ({
    userIdsFilter: {
      type: GT.List(GT.NonNullID),
    },
    phoneCountryCodesFilter: {
      type: GT.List(GT.NonNull(CountryCode)),
    },
    deepLink: {
      type: GT.String,
    },
    localizedPushContent: {
      type: GT.NonNullList(LocalizedPushContentInput),
    },
  }),
})

const TriggerMarketingNotificationMutation = GT.Field<
  null,
  GraphQLAdminContext,
  {
    input: {
      userIdsFilter: string[] | undefined
      phoneCountryCodesFilter: (string | Error)[] | undefined
      deepLink: string | undefined
      localizedPushContent: {
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
  type: GT.NonNull(TriggerMarketingNotificationPayload),
  args: {
    input: { type: GT.NonNull(TriggerMarketingNotificationInput) },
  },
  resolve: async (_, args) => {
    const { userIdsFilter, phoneCountryCodesFilter, deepLink, localizedPushContent } =
      args.input

    const nonErrorPhoneCountryCodesFilter: string[] = []
    for (const code of phoneCountryCodesFilter || []) {
      if (code instanceof Error) {
        return { errors: [{ message: code.message }], success: false }
      }
      nonErrorPhoneCountryCodesFilter.push(code)
    }

    const nonErrorLocalizedPushContent: {
      title: string
      body: string
      language: string
    }[] = []

    for (const content of localizedPushContent) {
      if (content.language instanceof Error) {
        return { errors: [{ message: content.language.message }], success: false }
      }
      nonErrorLocalizedPushContent.push({
        title: content.title,
        body: content.body,
        language: content.language,
      })
    }

    const res = await Admin.triggerMarketingNotification({
      userIdsFilter,
      phoneCountryCodesFilter: nonErrorPhoneCountryCodesFilter,
      deepLink,
      localizedPushContent: nonErrorLocalizedPushContent,
    })

    if (res instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(res)], success: false }
    }

    return {
      errors: [],
      success: res.success,
    }
  },
})

export default TriggerMarketingNotificationMutation
