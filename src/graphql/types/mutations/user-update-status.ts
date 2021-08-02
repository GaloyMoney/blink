import { GT } from "@graphql/index"
import { updateUserAccountStatus } from "@domain/user"
import AccountStatus from "../account-status"
import UserDetailPayload from "../payloads/user-detail"

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

const UserUpdateStatusMutation = {
  type: GT.NonNull(UserDetailPayload),
  args: {
    input: { type: GT.NonNull(UserUpdateStatusInput) },
  },
  resolve: async (_, args) => {
    const { uid, status } = args.input
    const user = await updateUserAccountStatus({ uid, status })
    return { errors: [], userDetails: user }
  },
}

export default UserUpdateStatusMutation
