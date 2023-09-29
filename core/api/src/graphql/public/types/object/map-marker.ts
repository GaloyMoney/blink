import { GT } from "@graphql/index"

import Username from "../../../shared/types/scalar/username"

import MapInfo from "./map-info"

const MapMarker = GT.Object({
  name: "MapMarker",
  fields: () => ({
    username: {
      type: Username,
    },
    mapInfo: {
      type: GT.NonNull(MapInfo),
    },
  }),
})

export default MapMarker
