export * from "./errors"

export const CacheKeys = {
  OffChainBalance: "lnd:offChainBalance",
  OffChainChannelBalances: "lnd:offChainChannelBalances",
  OnChainBalance: "lnd:onChainBalance",
  OpeningChannelBalance: "lnd:openingChannelBalance",
  ClosingChannelBalance: "lnd:closingChannelBalance",
  CurrentSatPrice: "price:current:sat",
  CurrentUsdCentPrice: "price:current:usdcent",
  PriceHistory: "price:history",
  PriceCurrencies: "price:currencies",
  LastOnChainTransactions: "bitcoin:lastOnChainTxs",
  BlockHeight: "bitcoin:blockHeight",
  ClosedChannels: "lnd:closedChannels",
} as const
