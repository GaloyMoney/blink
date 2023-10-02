export * from "./errors"

// from https://www.twilio.com/docs/lookup/v2-api/line-type-intelligence#type-property-values
export const CarrierType = {
  Landline: "landline",
  Mobile: "mobile",
  FixedVoip: "fixedVoip",
  NonFixedVoip: "nonFixedVoip",
  Personal: "personal",
  TollFree: "tollFree",
  Premium: "premium",
  SharedCost: "sharedCost",
  Uan: "uan",
  Voicemail: "voicemail",
  Pager: "pager",
  Unknown: "unknown",

  Null: "",

  // legacy
  // those values may have been returned histortically
  // TODO: migration to remove those values
  Voip: "voip",
} as const

export const ChannelType = {
  Sms: "sms",
  Whatsapp: "whatsapp",
} as const
