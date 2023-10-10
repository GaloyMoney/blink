import { Accounts } from "@/app"
import { UsernameIsImmutableError } from "@/domain/accounts"
import { mapAndParseErrorForGqlResponse } from "@/graphql/error-map"
import { GT } from "@/graphql/index"

import UserUpdateUsernamePayload from "@/graphql/public/types/payload/user-update-username"
import Username from "@/graphql/shared/types/scalar/username"

const UserUpdateUsernameInput = GT.Input({
  name: "UserUpdateUsernameInput",
  fields: () => ({
    username: { type: GT.NonNull(Username) },
  }),
})

const UserUpdateUsernameMutation = GT.Field({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(UserUpdateUsernamePayload),
  args: {
    input: { type: GT.NonNull(UserUpdateUsernameInput) },
  },
  deprecationReason:
    "Username will be moved to @Handle in Accounts. Also SetUsername naming should be used instead of UpdateUsername to reflect the idempotency of Handles",
  resolve: async (_, args, { domainAccount }: GraphQLPublicContextAuth) => {
    const { username } = args.input

    if (username instanceof Error) {
      return { errors: [{ message: username.message }] }
    }

    const result = await Accounts.setUsername({
      username,
      accountId: domainAccount.id,
    })

    if (result instanceof Error) {
      return {
        errors: [mapAndParseErrorForGqlResponse(result)],

        // FIXME: what is this return for?
        ...(result instanceof UsernameIsImmutableError ? { user: domainAccount } : {}),
      }
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
