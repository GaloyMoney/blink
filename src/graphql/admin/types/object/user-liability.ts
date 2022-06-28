import { GT } from "@graphql/index"

const UserLiability = GT.Object({
  name: "UserLiability",
  description: "User liability",
  fields: () => ({
    walletId: { type: GT.NonNullID },
    balance: { type: GT.NonNull(GT.Int) },
  }),
})
export default UserLiability
