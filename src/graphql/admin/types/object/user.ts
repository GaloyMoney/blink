import { GT } from "@graphql/index"
import Language from "@graphql/types/scalar/language"
import Phone from "@graphql/types/scalar/phone"
import Timestamp from "@graphql/types/scalar/timestamp"

const User = GT.Object<IdentityPhone>({
  name: "User",

  fields: () => ({
    id: { type: GT.NonNullID },
    phone: { type: GT.NonNull(Phone) },
    language: { type: GT.NonNull(Language) },
    createdAt: {
      type: GT.NonNull(Timestamp),
    },
  }),
})

export default User
