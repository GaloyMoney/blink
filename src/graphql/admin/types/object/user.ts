import { mapError } from "@graphql/error-map"
import { GT } from "@graphql/index"
import GraphQLEmail from "@graphql/types/object/email"
import Language from "@graphql/types/scalar/language"
import Phone from "@graphql/types/scalar/phone"
import Timestamp from "@graphql/types/scalar/timestamp"

// FIXME should not use service
import { IdentityRepository } from "@services/kratos"

const User = GT.Object<User>({
  name: "User",

  fields: () => ({
    id: { type: GT.NonNullID },
    phone: { type: GT.NonNull(Phone) },
    email: {
      type: GraphQLEmail,
      description: "Email address",
      resolve: async (source) => {
        const identity = await IdentityRepository().getIdentity(source.id)
        if (identity instanceof Error) throw mapError(identity)
        return identity
      },
    },
    language: { type: GT.NonNull(Language) },
    createdAt: {
      type: GT.NonNull(Timestamp),
    },
  }),
})

export default User
