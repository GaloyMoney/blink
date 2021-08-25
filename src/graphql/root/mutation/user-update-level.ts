import { GT } from "@graphql/index"
import AccountLevel from "@graphql/types/scalar/account-level"

import UserDetailPayload from "@graphql/types/payload/user-detail"
import { updateUserLevel } from "@domain/user"

const UserUpdateLevelInput = new GT.Input({
  name: "UserUpdateLevelInput",
  fields: () => ({
    uid: {
      type: GT.NonNullID,
    },
    level: {
      type: GT.NonNull(AccountLevel),
    },
  }),
})

const UserUpdateLevelMutation = GT.Field({
  type: GT.NonNull(UserDetailPayload),
  args: {
    input: { type: GT.NonNull(UserUpdateLevelInput) },
  },
  resolve: async (_, args) => {
    const { uid, level } = args.input
    const user = await updateUserLevel({ uid, level })
    return { errors: [], userDetails: user }
  },
})

export default UserUpdateLevelMutation
