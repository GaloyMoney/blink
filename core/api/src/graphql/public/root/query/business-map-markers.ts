import { GT } from "@/graphql/index"

import MapMarker from "@/graphql/public/types/object/map-marker"
import { mapError } from "@/graphql/error-map"
import { Accounts } from "@/app"

const BusinessMapMarkersQuery = GT.Field({
  type: GT.List(MapMarker),
  resolve: async (): Promise<BusinessMapMarker[] | { errors: IError[] }> => {
    const businesses = await Accounts.getBusinessMapMarkers()

    if (businesses instanceof Error) {
      throw mapError(businesses)
    }

    return businesses
  },
})

export default BusinessMapMarkersQuery
