import { GT } from "@graphql/index"

const WelcomeLeaders = GT.Object({
  name: "WelcomeLeaders",
  description: "Welcome leaders",
  fields: () => ({
    leaders: {
      type: GT.NonNullList(GT.String),
    },
  }),
})

export default WelcomeLeaders
