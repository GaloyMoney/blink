export * from "./errors"

export const PubSubDefaultTriggers = {
  PriceUpdate: "PRICE_UPDATE",
  UserPriceUpdate: "USER_PRICE_UPDATE",
  AccountUpdate: "ACCOUNT_UPDATE",
  LnPaymentStatus: "LN_PAYMENT_STATUS",
} as const

export const customPubSubTrigger = ({
  event,
  suffix,
}: {
  event: PubSubTrigger
  suffix: string
}): PubSubCustomTrigger => `${event}_${suffix}` as PubSubCustomTrigger
