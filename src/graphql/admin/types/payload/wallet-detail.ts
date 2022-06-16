import { GT } from "@graphql/index"
import IError from "@graphql/types/abstract/error"
import Wallet from "@graphql/types/abstract/wallet"

const WalletDetailPayload = GT.Object({
  name: "WalletDetailPayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    walletDetails: {
      type: Wallet,
    },
  }),
})

export default WalletDetailPayload
