import { GT } from "@graphql/index"

const InitiationLeaders = GT.Object({
  name: "InitiationLeaders",
  description: "Initiation leaders",
  fields: () => ({
    leaders: {
      type: GT.NonNullList(GT.String),
    },
  }),
})

export default InitiationLeaders
