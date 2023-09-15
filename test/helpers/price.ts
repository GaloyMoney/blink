export const generateSatoshiPriceHistory = (months: number, initialBtcPrice: number) => {
  const initDate = new Date()
  initDate.setHours(0, 0, 0, 0)
  initDate.setMonth(initDate.getMonth() - months)

  return generateRandomPriceData({
    initDate: unixTimestamp(initDate),
    endDate: unixTimestamp(new Date()),
    candleSize: 3600, // 1 hour
    initialPrice: initialBtcPrice,
  })
}

export const generateRandomPriceData = ({
  initDate,
  endDate,
  candleSize,
  initialPrice,
}: {
  initDate: number
  endDate: number
  candleSize: number
  initialPrice?: number
}) => {
  const startingPrice = initialPrice || Number(Math.floor(Math.random() * 1000) + 1)
  const marketWeighting = rnd(2) + -1
  const volatility = rnd(10) + 1
  const priceData: { date: number; price: number }[] = []

  let currentPrice = startingPrice

  for (let x = initDate; x < endDate; x += candleSize) {
    const significantMovement = rnd() < 0.01 ? 3 : 1
    const maxMovement = Number(currentPrice * 0.1 + volatility * marketWeighting)
    let movement = Math.abs(rnd(maxMovement))

    priceData.push({ date: x * 1000, price: Number(currentPrice.toFixed(2)) })

    movement = rnd() >= 0.5 || currentPrice < startingPrice ? movement : -movement
    currentPrice = currentPrice + movement * significantMovement
  }

  return priceData
}

const rnd = (val = 1) => Number(Math.random() * val)
const unixTimestamp = (date: Date) => Math.floor(date.getTime() / 1000)
