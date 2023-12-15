export const CallbackEventType = {
  SendIntraledger: "send.intraledger",
  ReceiveIntraledger: "receive.intraledger",
  SendLightning: "send.lightning",
  ReceiveLightning: "receive.lightning",
  SendOnchain: "send.onchain",
  ReceiveOnchain: "receive.onchain",
} as const
