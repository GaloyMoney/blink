import MapComponent from "@/components/map"
import { businessMapMarkers } from "@/services/galoy/graphql/queries/business-map-marker"
import Image from "next/image"

export default async function Home() {
  const mapData = await businessMapMarkers()
  if (mapData instanceof Error) {
    return <main>{mapData.message}</main>
  }

  return (
    <main>
      <div className="absolute ml-1 mt-1 rounded-xl bg-clip-padding backdrop-filter backdrop-blur-sm bg-opacity-10  z-10">
        <Image width={130} height={130} src={"/logo.svg"} alt="Blink Logo" />
      </div>
      <MapComponent mapData={mapData} />
    </main>
  )
}
