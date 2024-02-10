import MapComponent from "@/components/map"
import { env } from "@/env"
import { businessMapMarkers } from "@/services/galoy/graphql/queries/business-map-marker"
import Image from "next/image"

export default async function Home() {
  const mapData = await businessMapMarkers()
  if (mapData instanceof Error) {
    return <main>{mapData.message}</main>
  }

  const googleMapsApiKey = env.NEXT_PUBLIC_MAP_API_KEY 
  return (
    <main>
      <div className="absolute ml-1 mt-1 rounded-xl bg-clip-padding backdrop-filter backdrop-blur-sm bg-opacity-10  z-10">
        <Image width={130} height={130} src={"/logo.svg"} alt="Blink Logo" />
      </div>
      <MapComponent googleMapsApiKey={googleMapsApiKey} mapData={mapData} />
    </main>
  )
}
