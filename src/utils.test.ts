import { btc2sat, sat2btc } from "./utils"

it('btc2sat', async () => {
    const BTC = 1.2
    expect(btc2sat(BTC)).toEqual(120000000)
})

it('sat2btc', async () => {
    const sat = 120000000
    expect(sat2btc(sat)).toEqual(1.2)
})