import { GT } from "@graphql/index"
import Username from "@graphql/types/scalar/username"
import ContactAlias from "@graphql/types/scalar/contact-alias"
import UserContactUpdateAliasPayload from "@graphql/types/payload/user-contact-update-alias"

import * as Users from "@app/users"

const UserContactUpdateAliasInput = new GT.Input({
  name: "UserContactUpdateAliasInput",
  fields: () => ({
    username: { type: GT.NonNull(Username) },
    alias: { type: GT.NonNull(ContactAlias) },
  }),
})

const USerContactUpdateAliasMutation = GT.Field({
  type: GT.NonNull(UserContactUpdateAliasPayload),
  args: {
    input: { type: GT.NonNull(UserContactUpdateAliasInput) },
  },
  resolve: async (_, args, { uid }) => {
    const { username, alias } = args.input

    for (const input of [username, alias]) {
      if (input instanceof Error) {
        return { errors: [{ message: input.message }] }
      }
    }

    const user = await Users.updateContactAlias({
      userId: uid as UserId,
      username,
      alias,
    })

    if (user instanceof Error) {
      return { errors: [{ message: user.message }] }
    }

    return {
      errors: [],
      user,
    }
  },
})

export default USerContactUpdateAliasMutation
