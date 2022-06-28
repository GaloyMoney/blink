import { GT } from "@graphql/index"
import UserLiability from "@graphql/admin/types/object/user-liability"
import { getUserLiabilities } from "@app/proof-of-liabilities/get-user-liabilities"
const UserLiabilityQuery = GT.Field({
  type: GT.NonNull(GT.List(UserLiability)),
  resolve: async () => {
    const liabilities = await getUserLiabilities()
    if (liabilities instanceof Error) throw liabilities
    return liabilities
  },
})
export default UserLiabilityQuery
