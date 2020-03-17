import { priceBTC, getBalance, btc2sat } from "./exchange"

it('btc2sat', async () => {
    const BTC = 1.2
    expect(btc2sat(BTC)).toEqual(120000000)
})

it('test getting price', async () => {
    const p = await priceBTC()
    console.log(p)
    expect(p).toBeTruthy() // FIXME test will fail if kraken offline
})

it('fetchBalance', async () => {
    const balance = expect.objectContaining({
        USD: expect.any(Number), // how to set toBeGreaterThanOrEqual(0) ?
        BTC: expect.any(Number),
      })

    const result = await getBalance()
    expect(result).toEqual(balance)
})
