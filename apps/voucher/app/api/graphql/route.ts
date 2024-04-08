import { ApolloServer } from "@apollo/server"
import { startServerAndCreateNextHandler } from "@as-integrations/next"

import resolvers from "../../../graphql/resolvers"
import typeDefs from "../../../graphql/schema"
import { NextRequest } from "next/server"

const server = new ApolloServer({
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

const handler = startServerAndCreateNextHandler<NextRequest>(server)
export { handler as GET, handler as POST }
