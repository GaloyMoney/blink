import { GraphQLObjectType } from "graphql"

import { GT } from "@/graphql/index"
import Coordinates from "@/graphql/shared/types/object/coordinates"
import Timestamp from "@/graphql/shared/types/scalar/timestamp"
import Username from "@/graphql/shared/types/scalar/username"

const AuditedMerchant: GraphQLObjectType<BusinessMapMarker> =
  GT.Object<BusinessMapMarker>({
    name: "AuditedMerchant",
    fields: () => ({
      id: { type: GT.NonNullID },
      title: { type: GT.NonNull(GT.String) },
      coordinates: {
        type: Coordinates,
        description:
          "GPS coordinates for the merchant that can be used to place the related business on a map",
      },
      validated: {
        type: GT.NonNull(GT.Boolean),
        description: "Whether the merchant has been validated",
      },
      username: {
        type: GT.NonNull(Username),
        description: "The username of the merchant",
      },
      createdAt: {
        type: GT.NonNull(Timestamp),
        resolve: (source) => source.createdAt,
      },
    }),
  })

export default AuditedMerchant
