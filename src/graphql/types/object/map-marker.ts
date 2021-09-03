import { GT } from "@graphql/index"
import WalletName from "../scalar/wallet-name"
import MapInfo from "./map-info"

const MapMarker = new GT.Object({
  name: "MapMarker",
  fields: () => ({
    walletName: {
      type: WalletName,
    },
    mapInfo: {
      type: GT.NonNull(MapInfo),
    },
  }),
})

export default MapMarker
