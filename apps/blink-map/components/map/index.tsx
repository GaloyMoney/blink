"use client"
import React, { useState, useMemo, useEffect, useCallback, useRef } from "react"
import { GoogleMap, MarkerF, InfoWindow, useLoadScript } from "@react-google-maps/api"
import { BusinessMapMarkersQuery } from "@/services/galoy/graphql/generated"
import Link from "next/link"
import { theme } from "./map-theme"
import { env } from "@/env"

type MapComponentProps = {
  mapData: BusinessMapMarkersQuery["businessMapMarkers"]
}

export default function MapComponent({ mapData }: MapComponentProps) {
  const mapRef = useRef<google.maps.Map>()
  const [selectedMarker, setSelectedMarker] = useState<
    BusinessMapMarkersQuery["businessMapMarkers"][number] | null
  >(null)
  const [currentLocation, setCurrentLocation] = useState({
    lat: 13.7942,
    lng: -88.8965,
  })
  const libraries = useMemo(() => ["places"], [])
  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map
  }, [])

  const mapOptions = useMemo<google.maps.MapOptions>(
    () => ({
      disableDefaultUI: true,
      clickableIcons: true,
      zoomControl: true,
      maxZoom: 38,
      minZoom: 3,
      styles: [...theme, ...unwantedMarkers],
      restriction: {
        latLngBounds: {
          north: 85,
          south: -85,
          east: 180,
          west: -180,
        },
        strictBounds: true,
      },
    }),
    [],
  )

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
      },
      () => {
        console.error("Could not fetch the location")
      },
    )
  }, [])

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: env.NEXT_PUBLIC_MAP_API_TOKEN,
    libraries: libraries as any,
  })

  if (!isLoaded) {
    return <p>Loading...</p>
  }

  const handleMarkerClick = (
    marker: BusinessMapMarkersQuery["businessMapMarkers"][number],
  ) => {
    setSelectedMarker(marker)
  }

  const centerMapOnCurrentLocation = () => {
    if (mapRef.current) {
      mapRef.current.panTo(currentLocation)
      mapRef.current.setZoom(14)
    }
  }

  return (
    <>
      {/* TODO USE LOGO HERE */}
      <button
        className="absolute top-4 right-4 z-10 bg-white text-black p-2 rounded-md"
        onClick={centerMapOnCurrentLocation}
      >
        Center Me
      </button>
      <GoogleMap
        onLoad={onMapLoad}
        options={mapOptions}
        zoom={14}
        center={currentLocation}
        mapTypeId={google.maps.MapTypeId.ROADMAP}
        mapContainerStyle={{ width: "100vw", height: "100vh" }}
      >
        {mapData.map((marker) => (
          <MarkerF
            icon={{
              path: "M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z",
              fillColor: "#FEBE13",
              fillOpacity: 0.8,
              strokeWeight: 2,
              strokeColor: "gold",
              scale: 0.8,
            }}
            key={marker.username}
            position={{
              lat: marker.mapInfo.coordinates.latitude,
              lng: marker.mapInfo.coordinates.longitude,
            }}
            title={marker.username as string}
            onClick={() => handleMarkerClick(marker)}
          />
        ))}
        <MarkerF
          key="currentLocation"
          position={currentLocation}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: "#4285F4",
            fillOpacity: 1,
            scale: 6,
            strokeColor: "white",
            strokeWeight: 2,
          }}
          title="My Current Location"
        />
        {selectedMarker && (
          <InfoWindow
            position={{
              lat: selectedMarker.mapInfo.coordinates.latitude,
              lng: selectedMarker.mapInfo.coordinates.longitude,
            }}
            onCloseClick={() => setSelectedMarker(null)}
          >
            <div className="flex-col min-h-10 min-w-10 justify-center align-middle w-full">
              <h2 className="font-medium text-lg mb-3 text-center">
                {selectedMarker.username}
              </h2>
              <Link
                target="_blank"
                href={`https://pay.blink.sv/${selectedMarker.username}`}
              >
                <button className="w-full px-3 py-2 text-xs font-medium text-center bg-yellow-400 rounded-md">
                  Pay this user
                </button>
              </Link>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </>
  )
}

const unwantedMarkers = [
  {
    featureType: "poi",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "transit",
    elementType: "all",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "poi.business",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "poi.business",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "landscape.man_made",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "road",
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }],
  },
]
