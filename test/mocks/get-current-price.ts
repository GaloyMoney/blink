export const getCurrentPrice = async (): Promise<UsdPerSat | ApplicationError> => {
  return Promise.resolve(0.0005 as UsdPerSat)
}
