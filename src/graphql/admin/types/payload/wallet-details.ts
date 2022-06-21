import { GT } from "@graphql/index"
import IError from "@graphql/types/abstract/error"
import Wallet from "@graphql/types/abstract/wallet"

const WalletDetailsPayload = GT.Object({
  name: "WalletDetailsPayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    walletDetails: {
      type: GT.NonNullList(Wallet),
    },
  }),
})

export default WalletDetailsPayload
