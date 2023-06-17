import { GT } from "@graphql/index"

import EmailAddress from "../scalar/email-address"

const GraphQLEmail = GT.Object<AnyIdentity, GraphQLContextAuth>({
  name: "Email",
  fields: () => ({
    address: {
      type: EmailAddress,
      resolve: async (source) => {
        return source.email
      },
    },

    verified: {
      type: GT.Boolean,
      resolve: async (source) => {
        return source.emailVerified
      },
    },
  }),
})

export default GraphQLEmail
