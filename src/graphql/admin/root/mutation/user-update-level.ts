import { GT } from "@graphql/index"

import { updateUserLevel } from "@core/user"

import AccountLevel from "@graphql/admin/types/scalar/account-level"
import UserDetailPayload from "@graphql/admin/types/payload/user-detail"

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

    for (const input of [uid, level]) {
      if (input instanceof Error) {
        return { errors: [{ message: input.message }] }
      }
    }

    const user = await updateUserLevel({ uid, level })
    if (user instanceof Error) {
      return { errors: [{ message: user.message }] }
    }
    return { errors: [], userDetails: user }
  },
})

export default UserUpdateLevelMutation
