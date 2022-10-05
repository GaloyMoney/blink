import { GT } from "@graphql/index"
import PsbtDetailPayload from "@graphql/admin/types/payload/psbt-detail"
import { ColdStorage } from "@app"
import { mapAndParseErrorForGqlResponse } from "@graphql/error-map"
import SatAmount from "@graphql/types/scalar/sat-amount"
import TargetConfirmations from "@graphql/types/scalar/target-confirmations"

const ColdStorageRebalanceToHotWalletInput = GT.Input({
  name: "ColdStorageRebalanceToHotWalletInput",
  fields: () => ({
    walletName: { type: GT.NonNull(GT.String) },
    amount: { type: GT.NonNull(SatAmount) },
    targetConfirmations: { type: TargetConfirmations, defaultValue: 1 },
  }),
})

const ColdStorageRebalanceToHotWalletMutation = GT.Field({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(PsbtDetailPayload),
  args: {
    input: { type: GT.NonNull(ColdStorageRebalanceToHotWalletInput) },
  },
  resolve: async (_, args) => {
    const { walletName, amount, targetConfirmations } = args.input
    for (const input of [walletName, amount, targetConfirmations]) {
      if (input instanceof Error) {
        return { errors: [{ message: input.message }] }
      }
    }

    const result = await ColdStorage.rebalanceToHotWallet({
      walletName,
      amount,
      targetConfirmations,
    })

    if (result instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(result)] }
    }

    return { errors: [], psbtDetail: result }
  },
})

export default ColdStorageRebalanceToHotWalletMutation
