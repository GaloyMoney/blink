import { getBalances } from "../exchange"

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

    const result = await getBalances()
    expect(result).toEqual(balance)
})
