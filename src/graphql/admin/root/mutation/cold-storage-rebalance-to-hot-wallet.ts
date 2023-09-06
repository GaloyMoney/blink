import { OnChain } from "@app"

import { GT } from "@graphql/index"
import SatAmount from "@graphql/shared/types/scalar/sat-amount"
import { mapAndParseErrorForGqlResponse } from "@graphql/error-map"
import UnsignedPsbtPayload from "@graphql/admin/types/payload/unsigned-psbt"

const ColdStorageRebalanceToHotWalletInput = GT.Input({
  name: "ColdStorageRebalanceToHotWalletInput",
  fields: () => ({
    amount: { type: GT.NonNull(SatAmount) },
  }),
})

const ColdStorageRebalanceToHotWalletMutation = GT.Field({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(UnsignedPsbtPayload),
  args: {
    input: { type: GT.NonNull(ColdStorageRebalanceToHotWalletInput) },
  },
  resolve: async (_, args) => {
    const { amount } = args.input
    if (amount instanceof Error) {
      return { errors: [{ message: amount.message }] }
    }

    const unsignedPsbt = await OnChain.rebalanceToHotWallet({
      amount,
    })

    if (unsignedPsbt instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(unsignedPsbt)] }
    }

    return { errors: [], unsignedPsbt }
  },
})

export default ColdStorageRebalanceToHotWalletMutation
