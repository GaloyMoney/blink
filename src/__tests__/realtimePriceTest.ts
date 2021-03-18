/**
 * @jest-environment node
 */

import { init, main, median } from "../realtimePrice"

it('real time price', async () => {
  await init()
  await main()
})

it('median test', () => {
  expect(median([2, 1, 5])).toBe(2)
  expect(median([2, 1])).toBe(1.5)
  expect(median([2, 1, undefined])).toBe(1.5)
  expect(median([2, 1, undefined, 5])).toBe(2)
})