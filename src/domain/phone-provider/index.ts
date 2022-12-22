export * from "./errors"

export const CarrierType = {
  Landline: "landline",
  Void: "voip",
  Mobile: "mobile",
} as const

export const ChannelType = {
  Sms: "sms",
  Whatsapp: "whatsapp",
} as const
