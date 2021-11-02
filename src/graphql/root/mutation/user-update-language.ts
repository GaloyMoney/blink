import { GT } from "@graphql/index"

import UserUpdateLanguagePayload from "@graphql/types/payload/user-update-language"
import Language from "@graphql/types/scalar/language"

const UserUpdateLanguageInput = new GT.Input({
  name: "UserUpdateLanguageInput",
  fields: () => ({
    language: { type: GT.NonNull(Language) },
  }),
})

const UserUpdateLanguageMutation = GT.Field({
  type: GT.NonNull(UserUpdateLanguagePayload),
  args: {
    input: { type: GT.NonNull(UserUpdateLanguageInput) },
  },
  resolve: async (_, args, { wallet }) => {
    const { language } = args.input

    if (language instanceof Error) {
      return { errors: [{ message: language.message }] }
    }

    const result = await wallet.updateLanguage({ language })

    if (result instanceof Error) {
      return { errors: [{ message: result.message }] }
    }

    return {
      errors: [],
      user: result,
    }
  },
})

export default UserUpdateLanguageMutation
