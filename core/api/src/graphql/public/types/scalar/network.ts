import { GT } from "@/graphql/index"

const Network = GT.Enum({
  name: "Network",
  values: {
    mainnet: {},
    testnet: {},
    signet: {},
    regtest: {},
  },
})

export default Network
