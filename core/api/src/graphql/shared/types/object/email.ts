import EmailAddress from "../scalar/email-address"

import { GT } from "@/graphql/index"

const GraphQLEmail = GT.Object({
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
