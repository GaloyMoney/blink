export function isValidCoordinates({
  latitude,
  longitude,
}: {
  latitude: number
  longitude: number
}): boolean {
  const isValidLatitude: boolean = latitude >= -90 && latitude <= 90
  const isValidLongitude: boolean = longitude >= -180 && longitude <= 180
  return isValidLatitude && isValidLongitude
}
