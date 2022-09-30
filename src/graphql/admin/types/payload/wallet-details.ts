import { GT } from "@graphql/index"
import AppError from "@graphql/types/object/app-error"
import Wallet from "@graphql/types/abstract/wallet"

const WalletDetailsPayload = GT.Object({
  name: "WalletDetailsPayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(AppError),
    },
    walletDetails: {
      type: GT.NonNullList(Wallet),
    },
  }),
})

export default WalletDetailsPayload
