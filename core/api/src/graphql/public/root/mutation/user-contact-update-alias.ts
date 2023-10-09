import { GT } from "@/graphql/index"
import UserContactUpdateAliasPayload from "@/graphql/public/types/payload/user-contact-update-alias"
import ContactAlias from "@/graphql/public/types/scalar/contact-alias"
import Username from "@/graphql/shared/types/scalar/username"
import { Accounts } from "@/app"
import { InputValidationError } from "@/graphql/error"
import { mapAndParseErrorForGqlResponse } from "@/graphql/error-map"

const UserContactUpdateAliasInput = GT.Input({
  name: "UserContactUpdateAliasInput",
  fields: () => ({
    username: { type: GT.NonNull(Username) },
    alias: { type: GT.NonNull(ContactAlias) },
  }),
})

const UserContactUpdateAliasMutation = GT.Field<
  null,
  GraphQLPublicContextAuth,
  {
    input: {
      username: string | InputValidationError
      alias: string | InputValidationError
    }
  }
>({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(UserContactUpdateAliasPayload),
  args: {
    input: { type: GT.NonNull(UserContactUpdateAliasInput) },
  },
  deprecationReason: "will be moved to AccountContact",
  resolve: async (_, args, { domainAccount }) => {
    const { username, alias } = args.input

    if (username instanceof InputValidationError) {
      return { errors: [{ message: username.message }] }
    }

    if (alias instanceof InputValidationError) {
      return { errors: [{ message: alias.message }] }
    }

    const accountId = domainAccount.id

    const contact = await Accounts.updateContactAlias({
      accountId,
      username,
      alias,
    })

    if (contact instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(contact)] }
    }

    return {
      errors: [],
      contact,
    }
  },
})

export default UserContactUpdateAliasMutation
