"use client"
import React, { useState, useMemo, useEffect, useCallback, useRef } from "react"
import { GoogleMap, MarkerF, InfoWindow, useLoadScript } from "@react-google-maps/api"
import { BusinessMapMarkersQuery } from "@/services/galoy/graphql/generated"
import Link from "next/link"
import { theme } from "./map-theme"
import LocationIcon from "../logo/location"
import { SuggestMapFormSheet } from "./suggest-form"

type MapComponentProps = {
  mapData: BusinessMapMarkersQuery["businessMapMarkers"]
  googleMapsApiKey: string
}
const DEFAULT_LAT = 8.046367244910527
const DEFAULT_LNG = -45.043000891414344

export default function MapComponent({ mapData, googleMapsApiKey }: MapComponentProps) {
  const mapRef = useRef<google.maps.Map>()
  const [selectedMarker, setSelectedMarker] = useState<
    BusinessMapMarkersQuery["businessMapMarkers"][number] | null
  >(null)
  const [viewportHeight, setViewportHeight] = useState("100vh")
  const [currentLocation, setCurrentLocation] = useState({
    coordinates: {
      lat: DEFAULT_LAT,
      lng: DEFAULT_LNG,
    },
    userAllowedLocation: false,
  })

  useEffect(() => {
    const calculateViewportHeight = () => {
      setViewportHeight(`${window.innerHeight}px`)
    }
    calculateViewportHeight()
    window.addEventListener("resize", calculateViewportHeight)
    return () => window.removeEventListener("resize", calculateViewportHeight)
  }, [])

  const [draggablePin, setDraggablePin] = useState({
    coordinates: { lat: 0, lng: 0 },
    visible: false,
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
          coordinates: { lat: position.coords.latitude, lng: position.coords.longitude },
          userAllowedLocation: true,
        })
      },
      () => {
        console.error("Could not fetch the location")
      },
    )
  }, [])

  const { isLoaded } = useLoadScript({
    googleMapsApiKey,
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
      mapRef.current.panTo(currentLocation.coordinates)
      mapRef.current.setZoom(14)
    }
  }

  const addDraggablePin = () => {
    const center = mapRef?.current?.getCenter()

    if (!center) {
      return
    }

    setDraggablePin({
      coordinates: { lat: center?.lat(), lng: center?.lng() },
      visible: true,
    })
  }

  const cancelDraggablePin = () => {
    setDraggablePin({
      coordinates: { lat: 0, lng: 0 },
      visible: false,
    })
  }

  const handleDragEnd = (event: google.maps.MapMouseEvent) => {
    const lat = event?.latLng?.lat()
    const lng = event?.latLng?.lng()

    if (!lat || !lng) {
      return
    }

    setDraggablePin({
      coordinates: { lat, lng },
      visible: true,
    })
  }

  const onInputChangeDraggablePinLat = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDraggablePin({
      coordinates: { lat: Number(e.target.value), lng: draggablePin.coordinates.lng },
      visible: true,
    })

    if (!mapRef.current) {
      return
    }
    mapRef.current.panTo({
      lat: Number(e.target.value),
      lng: draggablePin.coordinates.lng,
    })
  }

  const onInputChangeDraggablePinLong = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDraggablePin({
      coordinates: { lat: draggablePin.coordinates.lat, lng: Number(e.target.value) },
      visible: true,
    })

    if (!mapRef.current) {
      return
    }
    mapRef.current.panTo({
      lat: draggablePin.coordinates.lat,
      lng: Number(e.target.value),
    })
  }

  return (
    <div
      style={{
        position: "relative",
        height: viewportHeight,
        width: "100vw",
        overflow: "hidden",
      }}
    >
      {draggablePin.visible && (
        <div className="absolute right-2 top-2 z-10 w-40">
          <div className="bg-white text-black p-2 rounded-md text-sm drop-shadow-2xl">
            <div className="flex flex-col mb-4">
              <label htmlFor="latitude" className="mb-1 text-xs font-bold">
                LAT
              </label>
              <input
                id="latitude"
                type="number"
                min={-90}
                max={90}
                placeholder="Latitude"
                value={draggablePin.coordinates.lat}
                onChange={onInputChangeDraggablePinLat}
                className="text-black p-1 rounded-md bg-gray-300  text-xs"
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="longitude" className="mb-1 text-xs font-bold">
                LNG
              </label>
              <input
                id="longitude"
                type="number"
                min={-180}
                max={180}
                placeholder="Longitude"
                value={draggablePin.coordinates.lng}
                onChange={onInputChangeDraggablePinLong}
                className="text-black p-1 rounded-md bg-gray-300  text-xs"
              />
            </div>
          </div>
        </div>
      )}

      {draggablePin.visible && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 bg-white text-black p-1 rounded-full flex justify-center text-sm gap-4 pr-3 pl-1">
          <SuggestMapFormSheet
            latitude={draggablePin.coordinates.lat}
            longitude={draggablePin.coordinates.lng}
          />
          <button onClick={cancelDraggablePin}>Cancel</button>
        </div>
      )}
      {!draggablePin.visible && (
        <button
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 bg-white text-black p-2 pr-3 pl-3 rounded-full text-sm"
          onClick={addDraggablePin}
        >
          Add New Location
        </button>
      )}
      {currentLocation.userAllowedLocation && (
        <button
          className="absolute right-2.5 z-10 bg-white text-black p-2 rounded-md"
          onClick={centerMapOnCurrentLocation}
          style={{ zIndex: 10, bottom: "7em" }}
        >
          <LocationIcon />
        </button>
      )}
      <GoogleMap
        onLoad={onMapLoad}
        options={mapOptions}
        zoom={4}
        center={currentLocation.coordinates}
        mapTypeId={google.maps.MapTypeId.ROADMAP}
        mapContainerStyle={{ height: "100%", width: "100%" }}
      >
        {mapData.map((marker, index) => (
          <MarkerF
            key={index}
            position={{
              lat: marker.mapInfo.coordinates.latitude,
              lng: marker.mapInfo.coordinates.longitude,
            }}
            title={marker.username}
            onClick={() => handleMarkerClick(marker)}
          />
        ))}
        {currentLocation.userAllowedLocation && (
          <MarkerF
            key="currentLocation"
            position={currentLocation.coordinates}
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
        )}
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
                {selectedMarker.mapInfo.title}
              </h2>
              <h3 className="font-medium text-md mb-3 text-center">
                {selectedMarker.username}
              </h3>
              <Link
                target="_blank"
                href={`https://pay.blink.sv/${selectedMarker.username}`}
              >
                <button className="w-full px-3 py-2 text-xs font-medium text-center bg-orange-500 rounded-full text-white">
                  Pay this user
                </button>
              </Link>
            </div>
          </InfoWindow>
        )}
        {draggablePin.visible && (
          <MarkerF
            position={draggablePin.coordinates}
            draggable={true}
            onDragEnd={handleDragEnd}
            icon={{
              path: "M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z",
              fillColor: "#FEBE13",
              fillOpacity: 0.8,
              strokeWeight: 2,
              strokeColor: "gold",
              scale: 0.8,
            }}
          />
        )}
      </GoogleMap>
    </div>
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
