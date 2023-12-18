import { gql } from "@apollo/client"

import { graphQlClient } from "../apollo-config"
import { CountryCodesDocument, CountryCodesQuery } from "../generated"

gql`
  query CountryCodes {
    globals {
      supportedCountries {
        id
        supportedAuthChannels
      }
    }
  }
`
export type AuthChannels = "SMS" | "WHATSAPP"

export interface SupportedCountry {
  readonly id: string
  readonly supportedAuthChannels: readonly AuthChannels[]
}

export const getSupportedCountryCodes = async (): Promise<
  readonly SupportedCountry[] | undefined
> => {
  try {
    const client = graphQlClient()
    const response = await client.query<CountryCodesQuery>({
      query: CountryCodesDocument,
    })
    return response.data?.globals?.supportedCountries
  } catch (err) {
    console.error("error in 'me-query' ", err)
    return undefined
  }
}
