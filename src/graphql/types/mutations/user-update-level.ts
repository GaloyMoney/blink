import { GT } from "@graphql/index"
import AccountLevel from "../account-level"

import UserDetailPayload from "../payloads/user-detail"
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

const UserUpdateLevelMutation = {
  type: GT.NonNull(UserDetailPayload),
  args: {
    input: { type: GT.NonNull(UserUpdateLevelInput) },
  },
  resolve: async (_, args) => {
    const { uid, level } = args.input
    const user = await updateUserLevel({ uid, level })
    return { errors: [], userDetails: user }
  },
}

export default UserUpdateLevelMutation
