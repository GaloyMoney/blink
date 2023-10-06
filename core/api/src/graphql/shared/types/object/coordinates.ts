import { GT } from "@/graphql/index"

const Coordinates = GT.Object({
  name: "Coordinates",
  fields: () => ({
    longitude: {
      type: GT.NonNull(GT.Float),
    },
    latitude: {
      type: GT.NonNull(GT.Float),
    },
  }),
})

export default Coordinates
