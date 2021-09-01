import { GT } from "@graphql/index"
import { updateUserAccountStatus } from "@core/user"

import UserDetailPayload from "@graphql/admin/types/payload/user-detail"
import AccountStatus from "@graphql/admin/types/scalar/account-status"

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
