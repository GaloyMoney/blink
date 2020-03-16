
import { priceBTC } from "./exchange"


it('a + b', async () => {
    const p = await priceBTC()
    console.log(p)
    expect(p).toBeTruthy()
})