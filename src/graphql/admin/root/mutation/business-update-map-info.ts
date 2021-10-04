import { GT } from "@graphql/index"

import { updateBusinessMapInfo } from "@core/user"

import UserDetailPayload from "@graphql/admin/types/payload/user-detail"
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

    const user = await updateBusinessMapInfo({ username, title, latitude, longitude })

    if (user instanceof Error) {
      return { errors: [{ message: user.message }] }
    }

    return {
      errors: [],
      userDetails: {
        id: user.id,
        username: user.username,
        level: user.level,
        status: user.status,
        phone: user.phone,
        title: user.title,
        coordinate: user.coordinate,
        created_at: user.created_at,
      },
    }
  },
})

export default BusinessUpdateMapInfoMutation
