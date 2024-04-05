import Username from "../../../shared/types/scalar/username"

import MapInfo from "./map-info"

import { GT } from "@/graphql/index"

const MapMarker = GT.Object({
  name: "MapMarker",
  fields: () => ({
    username: {
      type: GT.NonNull(Username),
    },
    mapInfo: {
      // TODO: deprecate, use a flat structure
      type: GT.NonNull(MapInfo),
    },
  }),
})

export default MapMarker
