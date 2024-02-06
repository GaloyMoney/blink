import { Merchants } from "@/app"
import { mapAndParseErrorForGqlResponse } from "@/graphql/error-map"
import { GT } from "@/graphql/index"
import MerchantPayload from "@/graphql/shared/types/payload/merchant"
import Username from "@/graphql/shared/types/scalar/username"

const MerchantMapSuggestInput = GT.Input({
  name: "MerchantMapSuggestInput",
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

const MerchantMapSuggestMutation = GT.Field<null, GraphQLPublicContext>({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(MerchantPayload),
  args: {
    input: { type: GT.NonNull(MerchantMapSuggestInput) },
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

    const merchant = await Merchants.suggestMerchantMap({
      username,
      title,
      coordinates,
    })

    if (merchant instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(merchant)] }
    }

    return {
      errors: [],
      merchant,
    }
  },
})

export default MerchantMapSuggestMutation
