import { gql } from "@apollo/client"

import { graphQlClient } from "../apollo-config"
import { GetUserIdDocument, GetUserIdQuery } from "../generated"

gql`
  query getUserId {
    me {
      id
    }
  }
`

export const getUserId = async (authToken: string): Promise<string | undefined> => {
  try {
    const client = graphQlClient(authToken)
    const response = await client.query<GetUserIdQuery>({
      query: GetUserIdDocument,
    })
    return response.data?.me?.id
  } catch (err) {
    console.error("error in 'me-query' ", err)
    return undefined
  }
}
