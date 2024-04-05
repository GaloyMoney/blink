import { Users } from "@/app"
import { mapAndParseErrorForGqlResponse } from "@/graphql/error-map"
import { GT } from "@/graphql/index"

import UserUpdateLanguagePayload from "@/graphql/public/types/payload/user-update-language"
import Language from "@/graphql/shared/types/scalar/language"

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
  resolve: async (_, args, { user }: GraphQLPublicContextAuth) => {
    const { language } = args.input

    if (language instanceof Error) {
      return { errors: [{ message: language.message }] }
    }

    const result = await Users.updateLanguage({
      userId: user.id,
      language,
    })

    if (result instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(result)] }
    }

    return {
      errors: [],
      // shouldn't this be me instead of user?
      user: result,
    }
  },
})

export default UserUpdateLanguageMutation
