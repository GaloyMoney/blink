import { walletNameAvailable } from "@app/wallets/wallet-name-available"
import { GT } from "@graphql/index"
import WalletName from "@graphql/types/scalar/wallet-name"

const WalletNameAvailableQuery = GT.Field({
  type: GT.Boolean,
  args: {
    walletName: {
      type: GT.NonNull(WalletName),
    },
  },
  resolve: async (_, args) => {
    const { walletName } = args

    if (walletName instanceof Error) {
      throw walletName
    }

    const available = await walletNameAvailable(walletName)

    if (available instanceof Error) {
      throw available
    }

    return available
  },
})

export default WalletNameAvailableQuery
