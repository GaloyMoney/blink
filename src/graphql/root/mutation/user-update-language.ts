import { Users } from "@app"
import { mapAndParseErrorForGqlResponse } from "@graphql/error-map"
import { GT } from "@graphql/index"

import UserUpdateLanguagePayload from "@graphql/types/payload/user-update-language"
import Language from "@graphql/types/scalar/language"

const UserUpdateLanguageInput = GT.Input({
  name: "UserUpdateLanguageInput",
  fields: () => ({
    language: { type: GT.NonNull(Language) },
  }),
})

const UserUpdateLanguageMutation = GT.Field({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(UserUpdateLanguagePayload),
  args: {
    input: { type: GT.NonNull(UserUpdateLanguageInput) },
  },
  resolve: async (_, args, { domainUser }: { domainUser: User }) => {
    const { language } = args.input

    if (language instanceof Error) {
      return { errors: [{ message: language.message }] }
    }

    const result = await Users.updateLanguage({ userId: domainUser.id, language })

    if (result instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(result)] }
    }

    return {
      errors: [],
      user: result,
    }
  },
})

export default UserUpdateLanguageMutation
