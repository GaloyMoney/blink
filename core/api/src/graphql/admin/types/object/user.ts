import { Users } from "@/app"
import { mapError } from "@/graphql/error-map"
import { GT } from "@/graphql/index"
import GraphQLEmail from "@/graphql/shared/types/object/email"
import Language from "@/graphql/shared/types/scalar/language"
import Phone from "@/graphql/shared/types/scalar/phone"
import Timestamp from "@/graphql/shared/types/scalar/timestamp"

// FIXME should not use service
import { IdentityRepository } from "@/services/kratos"

const User = GT.Object<User>({
  name: "AuditedUser",

  fields: () => ({
    id: { type: GT.NonNullID },
    phone: { type: Phone },

    email: {
      type: GraphQLEmail,
      description: "Email address",
      resolve: async (source) => {
        const identity = await IdentityRepository().getIdentity(source.id)
        if (identity instanceof Error) throw mapError(identity)
        return { address: identity.email, verified: identity.emailVerified }
      },
    },
    language: {
      type: GT.NonNull(Language),
      resolve: async (source) => {
        return Users.getUserLanguage(source.id)
      },
    },
    createdAt: {
      type: GT.NonNull(Timestamp),
    },
  }),
})

export default User
