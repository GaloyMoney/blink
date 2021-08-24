import { GT } from "@graphql/index"

import { updateMerchantMapInfo } from "@domain/user"
import UserDetailPayload from "./payload/user-detail"
import WalletName from "../scalar/wallet-name"

const MerchanUpdateMapInfoInput = new GT.Input({
  name: "MerchanUpdateMapInfoInput",
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

const MerchantUpdateMapInfoMutation = {
  type: GT.NonNull(UserDetailPayload),
  args: {
    input: { type: GT.NonNull(MerchanUpdateMapInfoInput) },
  },
  resolve: async (_, args) => {
    const { username, title, latitude, longitude } = args.input
    const user = await updateMerchantMapInfo({ username, title, latitude, longitude })
    return { errors: [], userDetails: user }
  },
}

export default MerchantUpdateMapInfoMutation
