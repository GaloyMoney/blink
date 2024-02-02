import { Merchants } from "@/app"
import { mapAndParseErrorForGqlResponse } from "@/graphql/error-map"
import { GT } from "@/graphql/index"
import MerchantPayload from "@/graphql/admin/types/payload/merchant"
import Username from "@/graphql/shared/types/scalar/username"

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

const BusinessUpdateMapInfoMutation = GT.Field<null, GraphQLAdminContext>({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(MerchantPayload),
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

    const merchant = await Merchants.updateBusinessMapInfo({
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

export default BusinessUpdateMapInfoMutation
