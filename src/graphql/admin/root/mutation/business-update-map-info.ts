import { Accounts } from "@app"
import AccountDetailPayload from "@graphql/admin/types/payload/account-detail"
import { mapAndParseErrorForGqlResponse } from "@graphql/error-map"
import { GT } from "@graphql/index"
import Username from "@graphql/types/scalar/username"

const BusinessUpdateMapInfoInput = GT.Input({
  name: "BusinessUpdateMapInfoInput",
  fields: () => ({
    username: {
      type: GT.NonNull(Username),
    },
    title: {
      type: GT.NonNull(GT.String),
    },
    longitude: {
      type: GT.NonNull(GT.Float),
    },
    latitude: {
      type: GT.NonNull(GT.Float),
    },
  }),
})

const BusinessUpdateMapInfoMutation = GT.Field({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(AccountDetailPayload),
  args: {
    input: { type: GT.NonNull(BusinessUpdateMapInfoInput) },
  },
  resolve: async (_, args) => {
    const { username, title, latitude, longitude } = args.input

    for (const input of [username, title, latitude, longitude]) {
      if (input instanceof Error) {
        return { errors: [{ message: input.message }] }
      }
    }

    const coordinates = {
      latitude,
      longitude,
    }

    const account = await Accounts.updateBusinessMapInfo({ username, title, coordinates })

    if (account instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(account)] }
    }

    return {
      errors: [],
      accountDetails: account,
    }
  },
})

export default BusinessUpdateMapInfoMutation
