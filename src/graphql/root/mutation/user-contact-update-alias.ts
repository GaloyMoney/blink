import { Accounts } from "@app"
import { GT } from "@graphql/index"
import UserContactUpdateAliasPayload from "@graphql/types/payload/user-contact-update-alias"
import ContactAlias from "@graphql/types/scalar/contact-alias"
import Username from "@graphql/types/scalar/username"

const UserContactUpdateAliasInput = new GT.Input({
  name: "UserContactUpdateAliasInput",
  fields: () => ({
    username: { type: GT.NonNull(Username) },
    alias: { type: GT.NonNull(ContactAlias) },
  }),
})

const UserContactUpdateAliasMutation = GT.Field({
  type: GT.NonNull(UserContactUpdateAliasPayload),
  args: {
    input: { type: GT.NonNull(UserContactUpdateAliasInput) },
  },
  deprecationReason: "will be moved to AccountContact",
  resolve: async (_, args, { domainAccount }) => {
    const { username, alias } = args.input

    for (const input of [username, alias]) {
      if (input instanceof Error) {
        return { errors: [{ message: input.message }] }
      }
    }

    const accountId = domainAccount.id

    const contact = await Accounts.updateContactAlias({
      accountId,
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

export default UserContactUpdateAliasMutation
