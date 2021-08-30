import { GT } from "@graphql/index"

const Globals = new GT.Object({
  name: "Globals",
  fields: () => ({
    nodesIds: {
      type: GT.NonNullList(GT.String),
    },
    // TODO: include GlobalSettings
  }),
})

export default Globals
