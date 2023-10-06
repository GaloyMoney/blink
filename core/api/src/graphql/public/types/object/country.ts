import CountryCode from "../scalar/country-code"
import PhoneCodeChannelType from "../../../shared/types/scalar/phone-code-channel-type"

import { GT } from "@/graphql/index"

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
