import { ApolloServer } from "@apollo/server"
import { startServerAndCreateNextHandler } from "@as-integrations/next"

import resolvers from "../../../graphql/resolvers"
import typeDefs from "../../../graphql/schema"

const Cors = require("micro-cors")
const cors = Cors()

export const server = new ApolloServer({
  typeDefs,
  resolvers,
  formatError: (err) => {
    return {
      message: err.message,
      locations: err.locations,
      code: err.extensions?.code,
    }
  },
})

export default cors(startServerAndCreateNextHandler(server))
