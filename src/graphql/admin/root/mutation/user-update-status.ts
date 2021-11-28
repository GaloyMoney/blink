import { GT } from "@graphql/index"

import UserDetailPayload from "@graphql/admin/types/payload/user-detail"
import AccountStatus from "@graphql/admin/types/scalar/account-status"
import { updateUserAccountStatus } from "@app/users/update-user-status"

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
    for (const input of [uid, status]) {
      if (input instanceof Error) {
        return { errors: [{ message: input.message }] }
      }
    }

    const user = await updateUserAccountStatus({ id: uid, status })
    if (user instanceof Error) {
      return { errors: [{ message: user.message }] }
    }
    return { errors: [], userDetails: user }
  },
})

export default UserUpdateStatusMutation
