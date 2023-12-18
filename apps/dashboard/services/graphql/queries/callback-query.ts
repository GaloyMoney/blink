import { gql } from "@apollo/client"

import { apollo } from ".."
import { CallbackEndpointsDocument, CallbackEndpointsQuery } from "../generated"

gql`
  query CallbackEndpoints {
    me {
      defaultAccount {
        callbackEndpoints {
          url
          id
        }
      }
    }
  }
`

export async function fetchCallbackData(token: string) {
  const client = apollo(token).getClient()
  try {
    const response = await client.query<CallbackEndpointsQuery>({
      query: CallbackEndpointsDocument,
    })
    return response
  } catch (err) {
    if (err instanceof Error) {
      console.error("error", err)
      throw new Error(err.message)
    } else {
      console.error("Unknown error")
      throw new Error("Unknown error")
    }
  }
}
