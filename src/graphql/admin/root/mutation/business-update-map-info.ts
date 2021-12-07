import { updateBusinessMapInfo } from "@app/accounts/update-business-map-info"
import AccountDetailPayload from "@graphql/admin/types/payload/account-detail"
import { mapError } from "@graphql/error-map"
import { GT } from "@graphql/index"
import Username from "@graphql/types/scalar/username"

const BusinessUpdateMapInfoInput = new GT.Input({
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

    const account = await updateBusinessMapInfo({ username, title, coordinates })

    if (account instanceof Error) {
      return { errors: [{ message: mapError(account).message }] }
    }

    return {
      errors: [],
      accountDetails: {
        id: account.id,
        username: account.username,
        level: account.level,
        status: account.status,
        title: account.title,
        coordinates: account.coordinates,
        createdAt: account.createdAt,
      },
    }
  },
})

export default BusinessUpdateMapInfoMutation
