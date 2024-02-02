import { Merchants } from "@/app"
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

const MerchantMapDeleteMutation = GT.Field<
  null,
  GraphQLAdminContext,
  {
    input: {
      // TODO: UUID v4 check
      id: string | InputValidationError
    }
  }
>({
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

    const account = await Merchants.deleteMerchantById(id as MerchantId)

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
