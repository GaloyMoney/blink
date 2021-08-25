import { GT } from "@graphql/index"
import { updateUserAccountStatus } from "@domain/user"
import AccountStatus from "@graphql/types/scalar/account-status"
import UserDetailPayload from "@graphql/types/payload/user-detail"

const UserUpdateStatusInput = new GT.Input({
  name: "UserUpdateStatusInput",
  fields: () => ({
    uid: {
      type: GT.NonNullID,
    },
    status: {
      type: GT.NonNull(AccountStatus),
    },
  }),
})

const UserUpdateStatusMutation = GT.Field({
  type: GT.NonNull(UserDetailPayload),
  args: {
    input: { type: GT.NonNull(UserUpdateStatusInput) },
  },
  resolve: async (_, args) => {
    const { uid, status } = args.input
    const user = await updateUserAccountStatus({ uid, status })
    return { errors: [], userDetails: user }
  },
})

export default UserUpdateStatusMutation
