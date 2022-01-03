import { GT } from "@graphql/index"

import Coordinates from "./coordinates"

const MapInfo = GT.Object({
  name: "MapInfo",
  fields: () => ({
    title: {
      type: GT.NonNull(GT.String),
    },
    coordinates: {
      type: GT.NonNull(Coordinates),
    },
  }),
})

export default MapInfo
