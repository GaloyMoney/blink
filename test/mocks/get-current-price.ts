export const getCurrentPrice = async (): Promise<
  DisplayCurrencyPerSat | ApplicationError
> => {
  return Promise.resolve(0.05 as DisplayCurrencyPerSat)
}
