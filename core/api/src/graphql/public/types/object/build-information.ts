import { GT } from "@/graphql/index"

const BuildInformation = GT.Object({
  name: "BuildInformation",
  fields: () => ({
    commitHash: { type: GT.String },
    helmRevision: { type: GT.Int },
  }),
})

export default BuildInformation
