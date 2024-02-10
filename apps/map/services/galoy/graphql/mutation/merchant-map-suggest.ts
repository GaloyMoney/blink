import { gql } from "@apollo/client"
import { apolloClient } from "../client"
import { MerchantMapSuggestDocument, MerchantMapSuggestMutation } from "../generated"

gql`
  mutation MerchantMapSuggest($input: MerchantMapSuggestInput!) {
    merchantMapSuggest(input: $input) {
      errors {
        code
        message
      }
      merchant {
        coordinates {
          latitude
          longitude
        }
        createdAt
        id
        title
        username
        validated
      }
    }
  }
`

export async function merchantMapSuggest(input: {
  latitude: number
  longitude: number
  title: string
  username: string
}): Promise<MerchantMapSuggestMutation["merchantMapSuggest"] | Error> {
  const client = apolloClient.UnAuthed()
  try {
    const response = await client.mutate<MerchantMapSuggestMutation>({
      mutation: MerchantMapSuggestDocument,
      variables: {
        input,
      },
    })

    if (!response?.data?.merchantMapSuggest) {
      return Error("No response")
    }

    return response.data.merchantMapSuggest
  } catch (err) {
    console.error("error while fetching MerchantMapSuggest", err)
    if (err instanceof Error) {
      return Error(err.message)
    } else {
      return Error("Unknown error")
    }
  }
}
