import { GT } from "@graphql/index"

const Language = new GT.Enum({
  name: "Language",
  values: {
    EN_US: { value: "en" },
    ES_SV: { value: "es" },
  },
})

export default Language
