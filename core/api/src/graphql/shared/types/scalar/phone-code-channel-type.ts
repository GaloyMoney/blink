import { GT } from "@/graphql/index"

const PhoneCodeChannelType = GT.Enum({
  name: "PhoneCodeChannelType",
  values: {
    SMS: {},
    WHATSAPP: {},
  },
})

export default PhoneCodeChannelType
