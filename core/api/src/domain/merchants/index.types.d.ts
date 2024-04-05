type BusinessMapTitle = string & { readonly brand: unique symbol }
type MerchantId = string & { readonly brand: unique symbol }

type Coordinates = {
  longitude: number
  latitude: number
}

type BusinessMapMarker = {
  id: MerchantId
  username: Username
  title: BusinessMapTitle
  coordinates: Coordinates
  validated: boolean
  createdAt: Date
}

// Legacy type used before refactoring of the
// merchant data structure
type BusinessMapInfoLegacy = {
  title: BusinessMapTitle
  coordinates: Coordinates
}

type BusinessMapMarkerLegacy = {
  username: Username
  mapInfo: BusinessMapInfoLegacy
}
