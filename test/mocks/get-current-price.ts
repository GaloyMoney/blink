export const getCurrentPrice = async (): Promise<
  DisplayCurrencyPerSat | ApplicationError
> => {
  // DisplayCurrencyPerSat is DollarsPerSat here
  return Promise.resolve(0.0005 as DisplayCurrencyPerSat)
}
