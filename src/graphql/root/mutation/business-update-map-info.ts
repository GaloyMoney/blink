import { GT } from "@graphql/index"

import { updateBusinessMapInfo } from "@domain/user"
import UserDetailPayload from "@graphql/types/payload/user-detail"
import WalletName from "@graphql/types/scalar/wallet-name"

const BusinessUpdateMapInfoInput = new GT.Input({
  name: "BusinessUpdateMapInfoInput",
  fields: () => ({
    walletName: {
      type: GT.NonNull(WalletName), // ?: This is converted from Username
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
    const { walletName, title, latitude, longitude } = args.input
    for (const input of [walletName, title, latitude, longitude]) {
      if (input instanceof Error) {
        return { errors: [{ message: input.message }] }
      }
    }

    const user = await updateBusinessMapInfo({ walletName, title, latitude, longitude })
    return {
      errors: [],
      userDetails: {
        id: user.id,
        walletName: user.username,
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
