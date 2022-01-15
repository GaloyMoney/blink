import { GT } from "@graphql/index"
import UserContactUpdateAliasPayload from "@graphql/types/payload/user-contact-update-alias"
import ContactAlias from "@graphql/types/scalar/contact-alias"
import Username from "@graphql/types/scalar/username"
import { Accounts } from "@app"
import { UserInputError } from "apollo-server-errors"

const UserContactUpdateAliasInput = GT.Input({
  name: "UserContactUpdateAliasInput",
  fields: () => ({
    username: { type: GT.NonNull(Username) },
    alias: { type: GT.NonNull(ContactAlias) },
  }),
})

const UserContactUpdateAliasMutation = GT.Field<
  { input: { username: string | UserInputError; alias: string | UserInputError } },
  null,
  GraphQLContextForUser
>({
  type: GT.NonNull(UserContactUpdateAliasPayload),
  args: {
    input: { type: GT.NonNull(UserContactUpdateAliasInput) },
  },
  deprecationReason: "will be moved to AccountContact",
  resolve: async (_, args, { domainAccount }) => {
    const { username, alias } = args.input

    if (username instanceof UserInputError) {
      return { errors: [{ message: username.message }] }
    }

    if (alias instanceof UserInputError) {
      return { errors: [{ message: alias.message }] }
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
