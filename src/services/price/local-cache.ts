import NodeCache from "node-cache"

export const CacheKeys = {
  CurrentPrice: "price:current",
  PriceHistory: (range: PriceRange, interval: PriceInterval) =>
    `price:history:${range}-${interval}`,
} as const

export const localCache = new NodeCache()
