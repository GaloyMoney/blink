export const getCurrentPrice = async (): Promise<
  DisplayCurrencyPerSat | ApplicationError
> => {
  return Promise.resolve(0.0005 as DisplayCurrencyPerSat)
}
