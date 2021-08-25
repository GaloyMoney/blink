import { GT } from "@graphql/index"
import MapInfo from "./map-info"

const MapMarker = new GT.Object({
  name: "MapMarker",
  fields: () => ({
    id: {
      type: GT.NonNullID,
    },
    username: {
      type: GT.String, // ?: confirm
    },
    mapInfo: {
      type: GT.NonNull(MapInfo),
    },
  }),
})

export default MapMarker
