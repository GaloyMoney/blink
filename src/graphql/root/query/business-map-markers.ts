import { GT } from "@graphql/index"

import MapMarker from "@graphql/types/object/map-marker"
import { Accounts } from "@app"

const BusinessMapMarkersQuery = GT.Field({
  type: GT.List(MapMarker),
  resolve: async (): Promise<BusinessMapMarker[]> => {
    const businesses = await Accounts.getBusinessMapMarkers()

    if (businesses instanceof Error) {
      throw businesses
    }

    return businesses
  },
})

export default BusinessMapMarkersQuery
