import Coordinates from "../../../shared/types/object/coordinates"

import { GT } from "@/graphql/index"

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
