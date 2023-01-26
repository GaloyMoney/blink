export const getCurrentPrice = async (): Promise<CurrentPrice | ApplicationError> => {
  // DisplayCurrencyPerSat is DollarsPerSat here
  return Promise.resolve({
    timestamp: new Date(Date.now()),
    price: 0.0005 as DisplayCurrencyPerSat,
  })
}
