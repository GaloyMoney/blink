import { Accounts } from "@app"
import { UsernameIsImmutableError } from "@domain/accounts"
import { mapError } from "@graphql/error-map"
import { GT } from "@graphql/index"

import UserUpdateUsernamePayload from "@graphql/types/payload/user-update-username"
import Username from "@graphql/types/scalar/username"

const UserUpdateUsernameInput = GT.Input({
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
  deprecationReason:
    "Username will be moved to @Handle in Accounts. Also SetUsername should be used instead of UpdateUsername to reflect the idempotency of Handles",
  resolve: async (_, args, { domainAccount, domainUser }: GraphQLContextForUser) => {
    const { username } = args.input

    if (username instanceof Error) {
      return { errors: [{ message: username.message }] }
    }

    const result = await Accounts.setUsername({ username, id: domainAccount.id })

    if (result instanceof Error) {
      const appErr = mapError(result)
      return result instanceof UsernameIsImmutableError
        ? { errors: [{ message: appErr.message || appErr.name }], user: domainUser }
        : { errors: [{ message: appErr.message || appErr.name }] }
    }

    return {
      errors: [],

      // TODO: move to accounts
      // TODO: username and id are not populated correctly (but those properties not been used currently by a client)
      user: result,
    }
  },
})

export default UserUpdateUsernameMutation
