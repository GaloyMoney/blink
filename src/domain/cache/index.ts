export * from "./errors"

export const CacheKeys = {
  OffChainBalance: "lnd:offChainBalance",
  OnChainBalance: "lnd:onChainBalance",
  OpeningChannelBalance: "lnd:openingChannelBalance",
  ClosingChannelBalance: "lnd:closingChannelBalance",
  CurrentPrice: "price:current",
  PriceHistory: "price:history",
  LastOnChainTransactions: "bitcoin:lastOnChainTxs",
  BlockHeight: "bitcoin:blockHeight",
  ClosedChannels: "lnd:closedChannels",
} as const
