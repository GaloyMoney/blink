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
  resolve: async (_, args, { user }) => {
    const { language } = args.input

    if (language instanceof Error) {
      return { errors: [{ message: language.message }] }
    }

    // TODO: redo this with app use-case
    try {
      user.language = language
      await user.save()
    } catch (err) {
      return { errors: [{ message: err.message }] }
    }

    return {
      errors: [],
      user,
    }
  },
})

export default UserUpdateLanguageMutation
