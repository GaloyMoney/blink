import { priceBTC, getBalance, btc2sat, sat2btc } from "./exchange"

it('btc2sat', async () => {
    const BTC = 1.2
    expect(btc2sat(BTC)).toEqual(120000000)
})

it('sat2btc', async () => {
    const sat = 120000000
    expect(sat2btc(sat)).toEqual(1.2)
})

it('test getting price', async () => {
    const p = await priceBTC()
    console.log(p)
    expect(p).toBeTruthy() // FIXME test will fail if kraken offline
})

it('fetchBalance', async () => {
    const balance = expect.objectContaining({
        USD: expect.objectContaining({
            total: expect.any(Number), // how to set toBeGreaterThanOrEqual(0) ?
            exchange: expect.any(Number),
        }),
        BTC: expect.objectContaining({
            total: expect.any(Number), // how to set toBeGreaterThanOrEqual(0) ?
            exchange: expect.any(Number),
            onchain: expect.any(Number),
            offchain: expect.any(Number),
        }),
      })

    const result = await getBalance()
    expect(result).toEqual(balance)
})
