export const getCurrentSatPrice = ({
  currency,
}: GetCurrentSatPriceArgs): Promise<
  RealTimePrice<DisplayCurrency> | ApplicationError
> => {
  return Promise.resolve({
    timestamp: new Date(Date.now()),
    price: 0.0005,
    currency: currency as DisplayCurrency,
  })
}

export const getCurrentUsdCentPrice = ({
  currency,
}: GetCurrentUsdCentPriceArgs): Promise<
  RealTimePrice<DisplayCurrency> | ApplicationError
> => {
  return Promise.resolve({
    timestamp: new Date(Date.now()),
    price: 21,
    currency: currency as DisplayCurrency,
  })
}
