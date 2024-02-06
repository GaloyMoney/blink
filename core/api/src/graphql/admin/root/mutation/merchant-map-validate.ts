import { Merchants } from "@/app"
import { checkedToMerchantId } from "@/domain/merchants"
import { mapAndParseErrorForGqlResponse } from "@/graphql/error-map"
import { GT } from "@/graphql/index"
import MerchantPayload from "@/graphql/shared/types/payload/merchant"

const MerchantMapValidateInput = GT.Input({
  name: "MerchantMapValidateInput",
  fields: () => ({
    id: {
      type: GT.NonNullID,
    },
  }),
})

const MerchantMapValidate = GT.Field<null, GraphQLAdminContext>({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(MerchantPayload),
  args: {
    input: { type: GT.NonNull(MerchantMapValidateInput) },
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

    const merchant = await Merchants.approveMerchantById(merchantId)

    if (merchant instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(merchant)] }
    }

    return {
      errors: [],
      merchant,
    }
  },
})

export default MerchantMapValidate
