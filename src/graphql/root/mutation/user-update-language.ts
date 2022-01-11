import { Users } from "@app"
import { mapError } from "@graphql/error-map"
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
  resolve: async (_, args, { domainUser }: { domainUser: User }) => {
    const { language } = args.input

    if (language instanceof Error) {
      return { errors: [{ message: language.message }] }
    }

    const result = await Users.updateLanguage({ userId: domainUser.id, language })

    if (result instanceof Error) {
      const appErr = mapError(result)
      return { errors: [{ message: appErr.message }] }
    }

    return {
      errors: [],
      user: result,
    }
  },
})

export default UserUpdateLanguageMutation
