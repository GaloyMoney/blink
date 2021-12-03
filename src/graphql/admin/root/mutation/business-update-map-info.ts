import { GT } from "@graphql/index"

import UserDetailPayload from "@graphql/admin/types/payload/user-detail"
import Username from "@graphql/types/scalar/username"
import { updateBusinessMapInfo } from "@app/accounts/update-business-map-info"
import { UserInputError } from "apollo-server-errors"

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
  type: GT.NonNull(UserDetailPayload),
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

    if (title.length < 3) return new UserInputError("title is too short")
    if (title.length > 100) return new UserInputError("title is too long")

    const coordinates = {
      latitude,
      longitude,
    }

    const account = await updateBusinessMapInfo({ username, title, coordinates })

    if (account instanceof Error) {
      return { errors: [{ message: account.message }] }
    }

    return {
      errors: [],
      // FIXME: rename accountDetails
      userDetails: {
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
