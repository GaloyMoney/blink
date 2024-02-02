import { GT } from "@/graphql/index"

import MapMarker from "@/graphql/public/types/object/map-marker"
import { mapError } from "@/graphql/error-map"
import { Merchants } from "@/app"

const BusinessMapMarkersQuery = GT.Field({
  type: GT.NonNullList(MapMarker),
  resolve: async (): Promise<BusinessMapMarkerLegacy[] | { errors: IError[] }> => {
    const merchants = await Merchants.getMerchantsMapMarkers()

    if (merchants instanceof Error) {
      throw mapError(merchants)
    }

    return merchants.map((merchant) => ({
      username: merchant.username,
      mapInfo: {
        title: merchant.title,
        coordinates: {
          latitude: merchant.coordinates.latitude,
          longitude: merchant.coordinates.longitude,
        },
      },
    }))
  },
})

export default BusinessMapMarkersQuery
