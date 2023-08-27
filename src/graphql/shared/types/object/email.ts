import { GT } from "@graphql/index"

import EmailAddress from "../scalar/email-address"

const GraphQLEmail = GT.Object<AnyIdentity, GraphQLPublicContextAuth>({
  name: "Email",
  fields: () => ({
    address: {
      type: EmailAddress,
    },

    verified: {
      type: GT.Boolean,
    },
  }),
})

export default GraphQLEmail
