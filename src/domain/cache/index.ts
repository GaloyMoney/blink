export * from "./errors"

export const CacheKeys = {
  CurrentPrice: "price:current",
  PriceHistory: "price:history",
  BlockHeight: "bitcoin:blockHeight",
} as const
