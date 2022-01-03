import { Accounts } from "@app"
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
  deprecationReason: "Username will be moved to @Handle in Accounts. Also SetUsername should be used instead of UpdateUpdate to reflect the idempotenty of Handles",
  resolve: async (_, args, { domainAccount }: { domainAccount: Account }) => {
    const { username } = args.input

    if (username instanceof Error) {
      return { errors: [{ message: username.message }] }
    }

    const result = await Accounts.setUsername({ username, id: domainAccount.id })

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
