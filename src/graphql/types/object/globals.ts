import { GT } from "@graphql/index"

const Globals = new GT.Object({
  name: "Globals",
  description:
  "Provides global settings for the application which might have an impact for the user.",
  fields: () => ({
    nodesIds: {
      type: GT.NonNullList(GT.String),
      description: "A list of public keys for the running lightning nodes.\nThis can be used to know if an invoice belongs to one of our nodes.",
    },
    // TODO: include GlobalSettings
  }),
})

export default Globals
