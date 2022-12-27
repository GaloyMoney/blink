export * from "./errors"

export const CacheKeys = {
  OffChainBalance: "lnd:offChainBalance",
  OffChainChannelBalances: "lnd:offChainChannelBalances",
  OnChainBalance: "lnd:onChainBalance",
  OpeningChannelBalance: "lnd:openingChannelBalance",
  ClosingChannelBalance: "lnd:closingChannelBalance",
  CurrentPrice: "price:current",
  PriceHistory: "price:history",
  PriceCurrencies: "price:currencies",
  LastOnChainTransactions: "bitcoin:lastOnChainTxs",
  BlockHeight: "bitcoin:blockHeight",
  ClosedChannels: "lnd:closedChannels",
} as const
