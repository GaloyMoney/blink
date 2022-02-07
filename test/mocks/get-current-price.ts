export const getCurrentPrice = async (): Promise<SatPerUsd | ApplicationError> => {
  return Promise.resolve(0.0005 as SatPerUsd)
}
