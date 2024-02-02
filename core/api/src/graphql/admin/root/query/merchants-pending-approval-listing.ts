import { GT } from "@/graphql/index"

import { Merchants } from "@/app"
import { mapError } from "@/graphql/error-map"
import Merchant from "@/graphql/shared/types/object/merchant"

const MerchantsPendingApprovalQuery = GT.Field({
  type: GT.List(Merchant),
  resolve: async (_, { id }) => {
    if (id instanceof Error) throw id

    const merchants = await Merchants.getMerchantsPendingApproval()

    if (merchants instanceof Error) {
      throw mapError(merchants)
    }

    return merchants
  },
})

export default MerchantsPendingApprovalQuery
