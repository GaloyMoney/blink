import { Merchants } from "@/app"
import { checkedToMerchantId } from "@/domain/merchants"
import { mapAndParseErrorForGqlResponse } from "@/graphql/error-map"
import { GT } from "@/graphql/index"
import MerchantPayload from "@/graphql/shared/types/payload/merchant"

const MerchantMapDeleteInput = GT.Input({
  name: "MerchantMapDeleteInput",
  fields: () => ({
    id: {
      type: GT.NonNullID,
    },
  }),
})

const MerchantMapDeleteMutation = GT.Field<null, GraphQLAdminContext>({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(MerchantPayload),
  args: {
    input: { type: GT.NonNull(MerchantMapDeleteInput) },
  },
  resolve: async (_, args) => {
    const { id } = args.input

    if (id instanceof Error) {
      return { errors: [{ message: id.message }] }
    }

    const merchantId = checkedToMerchantId(id)
    if (merchantId instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(merchantId)] }
    }

    const account = await Merchants.deleteMerchantById(merchantId)

    if (account instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(account)] }
    }

    return {
      errors: [],
      accountDetails: account,
    }
  },
})

export default MerchantMapDeleteMutation
