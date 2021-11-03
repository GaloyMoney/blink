import { GT } from "@graphql/index"

import IError from "../abstract/error"
import Language from "../scalar/language"

const UserLanguageDetails = new GT.Object({
  name: "UserLanguageDetails",
  fields: () => ({
    id: { type: GT.NonNullID },
    language: { type: GT.NonNull(Language) },
  }),
})

const UserUpdateLanguagePayload = new GT.Object({
  name: "UserUpdateLanguagePayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    user: {
      type: UserLanguageDetails,
    },
  }),
})

export default UserUpdateLanguagePayload
