import { GT } from "@graphql/index"

import UserUpdateUsernamePayload from "@graphql/types/payload/user-update-username"
import Username from "@graphql/types/scalar/username"

const UserUpdateUsernameInput = new GT.Input({
  name: "UserUpdateUsernameInput",
  fields: () => ({
    username: { type: GT.NonNull(Username) },
  }),
})

const UserUpdateUsernameMutation = GT.Field({
  type: GT.NonNull(UserUpdateUsernamePayload),
  args: {
    input: { type: GT.NonNull(UserUpdateUsernameInput) },
  },
  resolve: async (_, args, { wallet }) => {
    const { username } = args.input

    if (username instanceof Error) {
      return { errors: [{ message: username.message }] }
    }

    const result = await wallet.updateUsername({ username })

    if (result instanceof Error) {
      return { errors: [{ message: result.message }] }
    }

    return {
      errors: [],
      user: result,
    }
  },
})

export default UserUpdateUsernameMutation
