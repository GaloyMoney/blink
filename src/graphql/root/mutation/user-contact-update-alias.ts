import { GT } from "@graphql/index"
import Username from "@graphql/types/scalar/username"
import ContactAlias from "@graphql/types/scalar/contact-alias"

import * as Users from "@app/users"
import UserContactUpdateAliasPayload from "@graphql/types/payload/user-contact-update-alias"

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

    const contact = await Users.updateContactAlias({
      userId: uid as UserId,
      username,
      alias,
    })

    if (contact instanceof Error) {
      return { errors: [{ message: contact.message }] }
    }

    return {
      errors: [],
      contact,
    }
  },
})

export default USerContactUpdateAliasMutation
