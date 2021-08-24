import { GT } from "@graphql/index"

const SettlementMethod = new GT.Enum({
  name: "SettlementMethod",
  values: {
    INTRA_LEDGER: {},
    ON_CHAIN: {},
    LIGHTNING: {},
  },
})

export default SettlementMethod
