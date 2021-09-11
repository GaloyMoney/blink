type IError = {
  message: string
  path?: string
  // TODO: add code
}

type PriceType = {
  formattedAmount: string
  base: number
  offset: number
  currencyUnit: string
}

type PricePointType = {
  timestamp: number
  price: PriceType
}
