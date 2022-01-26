import { GT } from "@graphql/index"
import Timestamp from "@graphql/types/scalar/timestamp"

const BuildInformation = GT.Object({
  name: "BuildInformation",
  fields: () => ({
    commitHash: { type: GT.String },
    buildTime: { type: Timestamp },
    helmRevision: { type: GT.Int },
  }),
})

export default BuildInformation
