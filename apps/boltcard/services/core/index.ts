import { gql, GraphQLClient } from "graphql-request"
import { coreUrl } from "../config"

export const getCoreClient = (auth:string) => new GraphQLClient(coreUrl, {
  headers: {
    authorization: `Bearer ${auth}`,
  },
})
