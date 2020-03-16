
import { priceBTC } from "./exchange"


it('test getting price', async () => {
    const p = await priceBTC()
    console.log(p)
    expect(p).toBeTruthy()
})