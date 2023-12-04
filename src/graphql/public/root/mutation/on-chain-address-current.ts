import { GT } from "@graphql/index"
import { mapAndParseErrorForGqlResponse } from "@graphql/error-map"
import WalletId from "@graphql/shared/types/scalar/wallet-id"
import OnChainAddressPayload from "@graphql/public/types/payload/on-chain-address"
// import { Wallets } from "@app"

// FLASH FORK: import ibex dependencies
import { IbexRoutes } from "../../../../services/IbexHelper/Routes"

import { requestIBexPlugin } from "../../../../services/IbexHelper/IbexHelper"

const OnChainAddressCurrentInput = GT.Input({
  name: "OnChainAddressCurrentInput",
  fields: () => ({
    walletId: { type: GT.NonNull(WalletId) },
  }),
})

const OnChainAddressCurrentMutation = GT.Field({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(OnChainAddressPayload),
  args: {
    input: { type: GT.NonNull(OnChainAddressCurrentInput) },
  },
  resolve: async (_, args) => {
    const { walletId } = args.input
    if (walletId instanceof Error) {
      return { errors: [{ message: walletId.message }] }
    }

    // FLASH FORK: use IBEX to create on-chain address
    // const address = await Wallets.getLastOnChainAddress(walletId)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const CreateOnChain: any = await requestIBexPlugin(
      "POST",
      IbexRoutes.OnChain,
      {},
      {
        accountId: walletId,
      },
    )
    if (!CreateOnChain || !CreateOnChain.data || !CreateOnChain.data["data"]) {
      console.error({ error: "unable to get CreateOnChain" })
    } else {
      const address = CreateOnChain.data["data"]

      if (address instanceof Error) {
        return { errors: [mapAndParseErrorForGqlResponse(address)] }
      }

      return {
        errors: [],
        address,
      }
    }
  },
})

export default OnChainAddressCurrentMutation
