import { GT } from "@graphql/index"

import CountryCode from "../scalar/country-code"
import PhoneCodeChannelType from "../scalar/phone-code-channel-type"

const Country = GT.Object<Country>({
  name: "Country",
  fields: () => ({
    id: {
      type: GT.NonNull(CountryCode),
    },
    supportedAuthChannels: {
      type: GT.NonNullList(PhoneCodeChannelType),
      resolve: (source) =>
        source.supportedAuthChannels.map((channel) => channel.toUpperCase()),
    },
  }),
})

export default Country
