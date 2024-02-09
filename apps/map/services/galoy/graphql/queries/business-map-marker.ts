import { gql } from "@apollo/client"
import { apolloClient } from "../client"
import { BusinessMapMarkersDocument, BusinessMapMarkersQuery } from "../generated"

gql`
  query BusinessMapMarkers {
    businessMapMarkers {
      username
      mapInfo {
        title
        coordinates {
          latitude
          longitude
        }
      }
    }
  }
`

export async function businessMapMarkers(): Promise<
  BusinessMapMarkersQuery["businessMapMarkers"] | Error
> {
  const client = apolloClient.UnAuthed()
  try {
    const response = await client.query<BusinessMapMarkersQuery>({
      query: BusinessMapMarkersDocument,
    })
    return response.data.businessMapMarkers || []
  } catch (err) {
    console.error("error while fetching businessMapMarkers", err)
    if (err instanceof Error) {
      return Error(err.message)
    } else {
      return Error("Unknown error")
    }
  }
}
